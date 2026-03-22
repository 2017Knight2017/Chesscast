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
	deleteBranch: (path: number[], matchHistory: string[]) => void;
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
			const correctedParentPath = [...parentPath]; 
			let currentLevel = newTree;
			let targetIdx = -1;
			let isOnMainline = true;

			for (let depth = 0; depth < correctedParentPath.length; depth++) {
				let idx = correctedParentPath[depth];
				const historyMove = matchHistory[depth];

				// Ensure index 0 is the history move if it exists, but only if we are on the mainline.
				if (isOnMainline && historyMove) {
					if (!currentLevel[0] || currentLevel[0].m !== historyMove) {
						const existingIdx = currentLevel.findIndex(n => n.m === historyMove);
						if (existingIdx !== -1) {
							if (existingIdx > 0) {
								const [node] = currentLevel.splice(existingIdx, 1);
								currentLevel.unshift(node);
								
								// If our current path was affected by this move to front, adjust it
								if (idx === existingIdx) {
									idx = 0;
								} else if (idx < existingIdx) {
									idx++;
								}
							}
						} else {
							// History move missing from tree, insert at front
							currentLevel.unshift({ m: historyMove, s: [] });
							idx++;
						}
						correctedParentPath[depth] = idx;
					}
				}

				if (idx !== 0) isOnMainline = false;

				if (!currentLevel[idx]) {
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
				const nextMoveInHistory = matchHistory[correctedParentPath.length];

				if (isOnMainline && move === nextMoveInHistory) {
					currentLevel.unshift({ m: move, s: [] });
					targetIdx = 0;
				} else {
					currentLevel.push({ m: move, s: [] });
					targetIdx = currentLevel.length - 1;
				}
			} else {
				targetIdx = existingMoveIndex;
			}

			// Schedule navigation to the new move
			setTimeout(() => {
				setCurrentPath([...correctedParentPath, targetIdx]);
				setSelectedMoveIndex(null);
			}, 0);

			return newTree;
		});
	}, [setCurrentPath, setSelectedMoveIndex]);

	const deleteBranch = useCallback((path: number[], matchHistory: string[]) => {
		if (path.length === 0) return;

		setAnalysisTree((prevTree) => {
			const newTree = JSON.parse(JSON.stringify(prevTree)) as MoveTreeNode[];
			let currentLevel = newTree;
			
			// Navigate to the parent of the node to be deleted
			for (let i = 0; i < path.length - 1; i++) {
				const idx = path[i];
				if (!currentLevel[idx] || !currentLevel[idx].s) return prevTree;
				currentLevel = currentLevel[idx].s!;
			}

			const indexToDelete = path[path.length - 1];
			const depth = path.length - 1;
			const historyMove = matchHistory[depth];

			// Safety check: Don't allow deleting the main line move
			// A move is part of the main line if it's at index 0 and matches history
			if (indexToDelete === 0 && historyMove && currentLevel[0]?.m === historyMove) {
				console.warn("Cannot delete main line move");
				return prevTree;
			}

			if (currentLevel[indexToDelete]) {
				currentLevel.splice(indexToDelete, 1);
				
				// Navigate back to the parent
				setTimeout(() => {
					setCurrentPath(path.slice(0, -1));
					setSelectedMoveIndex(null);
				}, 0);
				
				return newTree;
			}

			return prevTree;
		});
	}, [setCurrentPath, setSelectedMoveIndex]);

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