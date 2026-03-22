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
	syncAnalysisToServer: (matchId: string, userId: number, tree?: MoveTreeNode[], path?: number[]) => void;
	saveAnalysis: (matchId: string, userId: number) => Promise<void>;
	discardAnalysis: (matchId: string, userId: number) => Promise<void>;
	checkExistingAnalysis: (matchId: string, userId: number) => Promise<boolean>;
	loadAnalysis: (matchId: string, userId: number) => Promise<void>;
	saveDraft: (matchId: string) => Promise<void>;
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
	const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

	const syncAnalysisToServer = useCallback((matchId: string, userId: number, tree?: MoveTreeNode[], path?: number[]) => {
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
			}, 30000); // Auto-save every 30 seconds
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

	useEffect(() => {
		const handleBeforeUnload = () => {
			if (isAnalysisMode && matchId && inspectedUserId === null) {
				const token = localStorage.getItem('token');
				if (token) {
					const url = `${process.env.NEXT_PUBLIC_NEST_API_URL || 'http://localhost:3001'}/user-analysis/save-draft`;
					const headers = {
						'Content-Type': 'application/json',
						'Authorization': `Bearer ${token}`
					};
					const blob = new Blob([JSON.stringify({ matchId })], { type: 'application/json' });
					
					// sendBeacon cannot send custom headers easily, 
					// but since our NestJS is likely configured for standard Auth, 
					// we might need a workaround or just rely on the 30s interval + periodic sync.
					// For simplicity and immediate effect, we use fetch with keepalive: true which is modern equivalent of sendBeacon that supports headers.
					fetch(url, {
						method: 'POST',
						headers,
						body: JSON.stringify({ matchId }),
						keepalive: true
					});
				}
			}
		};

		window.addEventListener('beforeunload', handleBeforeUnload);
		return () => window.removeEventListener('beforeunload', handleBeforeUnload);
	}, [isAnalysisMode, matchId, inspectedUserId]);

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
				saveDraft,
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