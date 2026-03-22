'use client';

import { useEffect, useState, useCallback } from 'react';
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
	} = useAnalysisState();

	const [showBeginPrompt, setShowBeginPrompt] = useState(false);

	const socket = useSocket();

	useEffect(() => {
		const handleAnalysisUpdate = (data: { movesTree: any; currentPath: number[] }) => {
			if (inspectedUserId && data.movesTree) {
				setAnalysisTree(data.movesTree);
			}
			if (inspectedUserId && data.currentPath) {
				setCurrentPath(data.currentPath);
			}
		};

		socket.on('analysisUpdate', handleAnalysisUpdate);

		return () => {
			socket.off('analysisUpdate', handleAnalysisUpdate);
		};
	}, [inspectedUserId, setAnalysisTree, setCurrentPath, socket]);

	useEffect(() => {
		if (isAnalysisMode && match?.id && userId && inspectedUserId === null) {
			syncAnalysisToServer(match.id, userId, undefined, currentPath);
		}
	}, [currentPath, isAnalysisMode, match?.id, userId, inspectedUserId, syncAnalysisToServer]);

	const handleMoveOnMainBoard = useCallback(() => {
		setSelectedMoveIndex(null);
		if (!isAnalysisMode && !showBeginPrompt && match && userId) {
			setShowBeginPrompt(true);
		}
	}, [isAnalysisMode, showBeginPrompt, match, userId, setSelectedMoveIndex]);

	const handleMainBoardClick = useCallback(async () => {
		setSelectedMoveIndex(null);
		if (isAnalysisMode && match?.id && userId && inspectedUserId === null) {
			await saveDraft(match.id);
			resetAnalysis();
			socket.emit('leaveAnalysisStream', { matchId: match.id, userId });
		} else if (isAnalysisMode) {
			resetAnalysis();
		}
	}, [isAnalysisMode, match?.id, userId, inspectedUserId, saveDraft, resetAnalysis, setSelectedMoveIndex, socket]);

	const handleBeginAnalysis = async () => {
		setShowBeginPrompt(false);
		setAnalysisMode(true);
		setInspectedUserId(null);

		if (hasExistingAnalysis && match?.id && userId) {
			await loadAnalysis(match.id, userId);
		}

		socket.emit('joinAnalysisStream', { matchId: match?.id, userId });
	};

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
		showBeginPrompt,
		setShowBeginPrompt,
		handleMoveOnMainBoard,
		handleMainBoardClick,
		handleBeginAnalysis,
		handleInspectUser
	};
}