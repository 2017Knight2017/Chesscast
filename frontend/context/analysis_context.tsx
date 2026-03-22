'use client';

import { createContext, useContext, useState, useCallback, ReactNode, useEffect, useRef, SetStateAction, Dispatch } from 'react';
import { MoveTreeNode } from '@/types/types';
import { useSocket } from '@/context/socket_context';
import { 
	saveAnalysisAction, 
	discardAnalysisAction, 
	checkExistingAnalysisAction, 
	loadAnalysisAction 
} from '@/actions/analysis_actions';


interface AnalysisContextType {
	isAnalysisMode: boolean;
	inspectedUserId: number | null;
	analysisTree: MoveTreeNode[];
	currentPath: number[];
	matchId: string | null;
	selectedMoveIndex: number | null;
	setAnalysisMode: (mode: boolean) => void;
	setInspectedUserId: (userId: number | null) => void;
	setAnalysisTree: (tree: MoveTreeNode[]) => void;
	setMatchId: (id: string | null) => void;
	addMoveToTree: (move: string, matchHistory: string[], parentPath?: number[]) => void;
	setCurrentPath: Dispatch<SetStateAction<number[]>>;
	setSelectedMoveIndex: (index: number | null) => void;
	resetAnalysis: () => void;
	syncAnalysisToServer: (matchId: string, userId: number) => void;
	saveAnalysis: (matchId: string, userId: number) => Promise<void>;
	discardAnalysis: (matchId: string, userId: number) => Promise<void>;
	checkExistingAnalysis: (matchId: string, userId: number) => Promise<boolean>;
	loadAnalysis: (matchId: string, userId: number) => Promise<void>;
}

const AnalysisContext = createContext<AnalysisContextType | undefined>(undefined);

export function AnalysisProvider({ children }: { children: ReactNode }) {
	const [isAnalysisMode, setAnalysisMode] = useState(false);
	const [inspectedUserId, setInspectedUserId] = useState<number | null>(null);
	const [analysisTree, setAnalysisTree] = useState<MoveTreeNode[]>([]);
	const [currentPath, setCurrentPath] = useState<number[]>([]);
	const [matchId, setMatchId] = useState<string | null>(null);
	const [selectedMoveIndex, setSelectedMoveIndex] = useState<number | null>(null);

	const socket = useSocket();
	const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

	const syncAnalysisToServer = useCallback((matchId: string, userId: number) => {
		if (debounceTimerRef.current) {
			clearTimeout(debounceTimerRef.current);
		}

		debounceTimerRef.current = setTimeout(() => {
			socket.emit('syncUserAnalysis', {
				matchId,
				userId,
				movesTree: analysisTree,
			});
		}, 300);
	}, [analysisTree, socket]);

	const addMoveToTree = useCallback((move: string, matchHistory: string[], parentPath: number[] = []) => {
		setAnalysisTree((prevTree) => {
			const newTree = JSON.parse(JSON.stringify(prevTree)) as MoveTreeNode[];
			let currentLevel = newTree;

			for (let depth = 0; depth < parentPath.length; depth++) {
				const idx = parentPath[depth];

				if (!currentLevel[idx]) {
					const historyMove = matchHistory[depth];

					if (historyMove) {
						currentLevel[idx] = { m: historyMove, s: [] };
					} else {
						console.error("Attempted to navigate beyond history without existing nodes");
						return prevTree;
					}
				}

				if (!currentLevel[idx].s) currentLevel[idx].s = [];
				currentLevel = currentLevel[idx].s!;
			}

			const existingMoveIndex = currentLevel.findIndex(node => node.m === move);

			if (existingMoveIndex === -1) {
				const nextMoveInHistory = matchHistory[parentPath.length];

				if (move === nextMoveInHistory) {
					currentLevel.unshift({ m: move, s: [] });
				} else {
					currentLevel.push({ m: move, s: [] });
				}
			}

			return newTree;
		});
	}, []);

	const resetAnalysis = useCallback(() => {
		setAnalysisMode(false);
		setInspectedUserId(null);
		setAnalysisTree([]);
		setCurrentPath([]);
		setMatchId(null);
		setSelectedMoveIndex(null);
	}, []);

	const saveAnalysis = useCallback(async (currentMatchId: string, userId: number) => {
		try {
			const token = localStorage.getItem('token');
			await saveAnalysisAction(currentMatchId, analysisTree, token);
			resetAnalysis();
		} catch (error) {
			console.error("Failed to save analysis:", error);
		}
	}, [analysisTree, resetAnalysis]);

	const discardAnalysis = useCallback(async (currentMatchId: string, userId: number) => {
		try {
			const token = localStorage.getItem('token');
			await discardAnalysisAction(currentMatchId, token);
			
			setAnalysisTree([]);
			setAnalysisMode(false);
			setInspectedUserId(null);
			setCurrentPath([]);
		} catch (error) {
			console.error("Failed to discard analysis:", error);
		}
	}, []);

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
				setCurrentPath,
				setSelectedMoveIndex,
				resetAnalysis,
				syncAnalysisToServer,
				saveAnalysis,
				discardAnalysis,
				checkExistingAnalysis,
				loadAnalysis,
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