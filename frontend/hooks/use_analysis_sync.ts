'use client';

import { useEffect, useCallback } from 'react';
import { useSocket } from '@/context/socket_context';
import { useAnalysisState } from '../context/analysis_context';
import { Match } from '@/types/types';
import { getPlayerByUsernameAction } from '@/actions/analysis_actions';

interface UseAnalysisSyncProps {
	match: Match;
	userId: number | null;
	hasExistingAnalysis: boolean;
}

export function useAnalysisSync({ match, userId, hasExistingAnalysis }: UseAnalysisSyncProps) {
	const {
		isAnalysisMode,
		inspectedUserId,
		setAnalysisMode,
		setInspectedUserId,
		setAnalysisTree,
		currentPath,
		setCurrentPath,
		setSelectedMoveIndex,
		saveDraft,
		resetAnalysis,
		loadAnalysis,
		syncAnalysisToServer,
		analysisTree,
		discardAnalysis
	} = useAnalysisState();

	const socket = useSocket();

	useEffect(() => {
		const handleAnalysisUpdate = (data: { matchId: string; userId: number; movesTree: any; currentPath: number[] }) => {
			if (data.matchId === match?.id && data.userId === inspectedUserId) {
				if (data.movesTree) {
					setAnalysisTree(data.movesTree);
				}
				if (data.currentPath) {
					setCurrentPath(data.currentPath);
				}
			}
		};

		socket.on('analysisUpdate', handleAnalysisUpdate);

		return () => {
			socket.off('analysisUpdate', handleAnalysisUpdate);
		};
	}, [inspectedUserId, setAnalysisTree, setCurrentPath, socket, match?.id]);

	useEffect(() => {
		if (isAnalysisMode && match?.id && userId && inspectedUserId === null) {
			syncAnalysisToServer(match.id, userId, undefined, currentPath);
		}
	}, [currentPath, isAnalysisMode, match?.id, userId, inspectedUserId, syncAnalysisToServer]);

	const handleInteractionOnMainBoard = useCallback(async (type: 'move' | 'select') => {
		const canStart = (type === 'move' && !hasExistingAnalysis) || 
						 (type === 'select' && hasExistingAnalysis);

		if (canStart && match && userId) {
			setAnalysisMode(true);
			setInspectedUserId(null);

			if (hasExistingAnalysis && match?.id && userId) {
				await loadAnalysis(match.id, userId);
			}

			socket.emit('joinAnalysisStream', { matchId: match?.id, userId });
		}
	}, [isAnalysisMode, hasExistingAnalysis, match, userId]);

	const handleMainBoardClick = useCallback(async () => {
		let hasExistingAnalysis: boolean;
		if (userId && Object.keys(analysisTree).length === 0) {
			await discardAnalysis(match.id, userId);
			hasExistingAnalysis = false;
		} else {
			await saveDraft(match.id);
			hasExistingAnalysis = true
		}
		
		setSelectedMoveIndex(null);
		resetAnalysis();
		socket.emit('leaveAnalysisStream', { matchId: match.id, userId });
		return hasExistingAnalysis;

	}, [isAnalysisMode, match?.id, userId, inspectedUserId, analysisTree, saveDraft, resetAnalysis, setSelectedMoveIndex, socket]);

	const handleInspectUser = async (username: string) => {
		const result = await getPlayerByUsernameAction(username);

		if (!result.success || !result.data) {
			console.error(result.error);
			return;
		}

		const playerData = result.data;

		setInspectedUserId(playerData.userId);

		if (match.id) {
			await loadAnalysis(match.id, playerData.userId);
			socket.emit('joinAnalysisStream', { 
				matchId: match.id, 
				userId: playerData.userId 
			});
		}
	};

	return {
		handleInteractionOnMainBoard,
		handleMainBoardClick,
		handleInspectUser
	};
}