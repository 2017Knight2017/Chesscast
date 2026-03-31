'use client';

import { createContext, useContext, useState, useCallback, ReactNode, useEffect, useRef, SetStateAction, Dispatch } from 'react';
import { MoveTreeNode } from '@/types/types';
import { useSocket } from '@/context/socket_context';
import { 
	saveAnalysisAction, 
	discardAnalysisAction, 
	checkExistingAnalysisAction, 
	loadAnalysisAction,
	saveAnalysisDraftAction
} from '@/actions/analysis_actions';

interface AnalysisContextType {
	isAnalysisMode: boolean;
	inspectedUserId: number | null;
	analysisTree: Record<number, MoveTreeNode[]>;
	currentPath: number[];
	matchId: string | null;
	selectedMoveIndex: number | null;
	setAnalysisMode: (mode: boolean, fen?: string) => void;
	setInspectedUserId: (userId: number | null) => void;
	setAnalysisTree: (tree: Record<number, MoveTreeNode[]>) => void;
	setMatchId: (id: string | null) => void;
	addMoveToTree: (move: string, branchRootIndex: number, parentPath?: number[]) => void;
	deleteBranch: (branchRootIndex: number, path: number[]) => void;
	setCurrentPath: Dispatch<SetStateAction<number[]>>;
	setSelectedMoveIndex: (index: number | null) => void;
	resetAnalysis: () => void;
	syncAnalysisToServer: (matchId: string, userId: number, tree?: Record<number, MoveTreeNode[]>, path?: number[]) => void;
	saveAnalysis: (matchId: string, userId: number) => Promise<void>;
	discardAnalysis: (matchId: string, userId: number) => Promise<void>;
	checkExistingAnalysis: (matchId: string, userId: number) => Promise<boolean>;
	loadAnalysis: (matchId: string, userId: number) => Promise<void>;
	saveDraft: (matchId: string) => Promise<void>;
	broadcastFen: (fen: string) => void;
}

const AnalysisContext = createContext<AnalysisContextType | undefined>(undefined);

export function AnalysisProvider({ children }: { children: ReactNode }) {
	const [isAnalysisMode, setIsAnalysisMode] = useState(false);
	const [inspectedUserId, setInspectedUserId] = useState<number | null>(null);
	const [analysisTree, setAnalysisTree] = useState<Record<number, MoveTreeNode[]>>({});
	const [currentPath, setCurrentPath] = useState<number[]>([]);
	const [matchId, setMatchId] = useState<string | null>(null);
	const [selectedMoveIndex, setSelectedMoveIndex] = useState<number | null>(null);

	const socket = useSocket();
	const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
	const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

	const setAnalysisMode = useCallback((mode: boolean, fen?: string) => {
		setIsAnalysisMode(mode);

		const username = localStorage.getItem('username');
		if (!matchId || !username) return;

		const event = mode ? 'userStartedAnalysis' : 'userStoppedAnalysis';
		const data: any = { matchId, username };
		if (mode && fen) {
			data.currentFen = fen;
		}
		socket.emit(event, data);
		
	}, [matchId, socket]);

	const broadcastFen = useCallback((fen: string) => {
		if (matchId) {
			const username = localStorage.getItem('username');
			if (username) {
				socket.emit('broadcastAnalysisPosition', { matchId, username, fen });
			}
		}
	}, [matchId, socket]);

	const syncAnalysisToServer = useCallback((matchId: string, userId: number, tree?: Record<number, MoveTreeNode[]>, path?: number[]) => {
		if (debounceTimerRef.current) {
			clearTimeout(debounceTimerRef.current);
		}

		debounceTimerRef.current = setTimeout(() => {
			socket.emit('syncUserAnalysis', {
				matchId,
				userId,
				movesTree: tree || analysisTree,
				currentPath: path || currentPath
			});
		}, 300);
	}, [analysisTree, currentPath, socket]);

	const saveDraft = useCallback(async (currentMatchId: string) => {
		try {
			const token = localStorage.getItem('token');
			if (!token) return;
			await saveAnalysisDraftAction(currentMatchId, token);
		} catch (error) {
			console.error("Failed to save analysis draft:", error);
		}
	}, []);

	useEffect(() => {
		if (isAnalysisMode && matchId && inspectedUserId === null) {
			autoSaveTimerRef.current = setInterval(() => {
				saveDraft(matchId);
			}, 30000);
		} else {
			if (autoSaveTimerRef.current) {
				clearInterval(autoSaveTimerRef.current);
			}
		}

		return () => {
			if (autoSaveTimerRef.current) {
				clearInterval(autoSaveTimerRef.current);
			}
		};
	}, [isAnalysisMode, matchId, inspectedUserId, saveDraft]);

	const addMoveToTree = useCallback((move: string, branchRootIndex: number, parentPath: number[] = []) => {
		setAnalysisTree((prevTree) => {
			const newTree = structuredClone(prevTree);
			
			if (!newTree[branchRootIndex]) {
				newTree[branchRootIndex] = [];
			}

			let currentLevel = newTree[branchRootIndex];
			let targetIdx = -1;

			for (let i = 0; i < parentPath.length; i++) {
				const idx = parentPath[i];
				if (!currentLevel[idx]) {
					return prevTree;
				}
				if (!currentLevel[idx].s) currentLevel[idx].s = [];
				currentLevel = currentLevel[idx].s!;
			}

			const existingMoveIndex = currentLevel.findIndex(node => node.m === move);

			if (existingMoveIndex === -1) {
				currentLevel.push({ m: move, s: [] });
				targetIdx = currentLevel.length - 1;
			} else {
				targetIdx = existingMoveIndex;
			}

			setCurrentPath([...parentPath, targetIdx]);
			return newTree;
		});
	}, [setCurrentPath]);

	const deleteBranch = useCallback((branchRootIndex: number, path: number[]) => {
		if (path.length === 0) return;

		setAnalysisTree((prevTree) => {
			const newTree = structuredClone(prevTree);
			if (!newTree[branchRootIndex]) return prevTree;

			let currentLevel = newTree[branchRootIndex];
			
			for (let i = 0; i < path.length - 1; i++) {
				const idx = path[i];
				if (!currentLevel[idx] || !currentLevel[idx].s) return prevTree;
				currentLevel = currentLevel[idx].s!;
			}

			const indexToDelete = path[path.length - 1];

			if (currentLevel[indexToDelete]) {
				currentLevel.splice(indexToDelete, 1);
				
				if (path.length === 1 && currentLevel.length === 0) {
					delete newTree[branchRootIndex];
				}

				setTimeout(() => {
					setCurrentPath(path.slice(0, -1));
				}, 0);
				
				return newTree;
			}

			return prevTree;
		});
	}, [setCurrentPath]);

	const resetAnalysis = useCallback(() => {
		setAnalysisMode(false);
		setInspectedUserId(null);
		setAnalysisTree({});
		setCurrentPath([]);
		setMatchId(null);
		setSelectedMoveIndex(null);
	}, [setAnalysisMode]);

	const saveAnalysis = useCallback(async (currentMatchId: string) => {
		try {
			const token = localStorage.getItem('token');
			await saveAnalysisAction(currentMatchId, analysisTree, token);
			resetAnalysis();
		} catch (error) {
			console.error("Failed to save analysis:", error);
		}
	}, [analysisTree, resetAnalysis]);

	const discardAnalysis = useCallback(async (currentMatchId: string) => {
		try {
			const token = localStorage.getItem('token');
			await discardAnalysisAction(currentMatchId, token);
			resetAnalysis();
		} catch (error) {
			console.error("Failed to discard analysis:", error);
		}
	}, [resetAnalysis]);

	const checkExistingAnalysis = useCallback(async (currentMatchId: string, userId: number): Promise<boolean> => {
		try {
			return await checkExistingAnalysisAction(currentMatchId, userId);
		} catch (error) {
			console.error("Failed to check existing analysis:", error);
			return false;
		}
	}, []);

	const loadAnalysis = useCallback(async (currentMatchId: string, userId: number) => {
		try {
			const data = await loadAnalysisAction(currentMatchId, userId);
			if (data && data.data) {
				setAnalysisTree(data.data);
			}
		} catch (error) {
			console.error("Failed to load analysis:", error);
		}
	}, []);

	return (
		<AnalysisContext.Provider
			value={{
				isAnalysisMode,
				inspectedUserId,
				analysisTree,
				currentPath,
				matchId,
				selectedMoveIndex,
				setAnalysisMode,
				setInspectedUserId,
				setAnalysisTree,
				setMatchId,
				addMoveToTree,
				deleteBranch,
				setCurrentPath,
				setSelectedMoveIndex,
				resetAnalysis,
				syncAnalysisToServer,
				saveAnalysis,
				discardAnalysis,
				checkExistingAnalysis,
				loadAnalysis,
				saveDraft,
				broadcastFen,
			}}
		>
			{children}
		</AnalysisContext.Provider>
	);
}

export function useAnalysisState() {
	const context = useContext(AnalysisContext);
	if (context === undefined) {
		throw new Error('useAnalysisState must be used within an AnalysisProvider');
	}
	return context;

}