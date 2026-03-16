'use client';

import { createContext, useContext, useState, useCallback, ReactNode, useEffect, useRef } from 'react';
import { MoveTreeNode } from '@/types/types';
import { io, Socket } from 'socket.io-client';
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
	setCurrentPath: (path: number[]) => void;
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

    const socketRef = useRef<Socket | null>(null);
    const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        socketRef.current = io(process.env.NEXT_PUBLIC_SOCKET_URL, {
            transports: ['websocket'],
        });

        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect();
            }
        };
    }, []);

    const syncAnalysisToServer = useCallback((matchId: string, userId: number) => {
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }

        debounceTimerRef.current = setTimeout(() => {
            socketRef.current?.emit('syncUserAnalysis', {
                matchId,
                userId,
                movesTree: analysisTree,
            });
        }, 300);
    }, [analysisTree]);

    const addMoveToTree = useCallback((move: string, matchHistory: string[], parentPath: number[] = []) => {
        setAnalysisTree((prevTree) => {
            const newTree = JSON.parse(JSON.stringify(prevTree)) as MoveTreeNode[];
            let currentLevel = newTree;
            let pathIndex = 0;

            for (const idx of parentPath) {
                if (!currentLevel[idx]) {
                    currentLevel[idx] = { m: move, s: [] };
                    break;
                }
                if (!currentLevel[idx].s) {
                    currentLevel[idx].s = [];
                }
                currentLevel = currentLevel[idx].s!;
                pathIndex++;
            }

            const nextMoveIndex = parentPath.length;
            const expectedMove = matchHistory[nextMoveIndex];

            if (expectedMove && move === expectedMove) {
                if (currentLevel.length > 0) {
                    currentLevel.push({ m: move, s: [] });
                } else {
                    currentLevel.push({ m: move });
                }
            } else {
                const lastNode = currentLevel[currentLevel.length - 1];
                if (lastNode) {
                    if (!lastNode.s) {
                        lastNode.s = [];
                    }
                    lastNode.s.push({ m: move, s: [] });
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

export function useAnalysis() {
    const context = useContext(AnalysisContext);
    if (context === undefined) {
        throw new Error('useAnalysis must be used within an AnalysisProvider');
    }
    return context;
}