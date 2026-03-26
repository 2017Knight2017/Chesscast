import { useEffect, useCallback } from 'react';
import { useSocket } from '@/context/socket_context';
import { useAnalysisState } from '../context/analysis_context';
import { Match } from '@/types/types';
import { getPlayerByUsernameAction } from '@/actions/analysis_actions';
import { ViewerStatus } from './use_viewer_counts';

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

		const handleStreamEnded = (data: { matchId: string; username: string }) => {
			if (data.matchId === match?.id && inspectedUserId !== null) {
				alert(`Analysis by ${data.username} has ended.`);
				resetAnalysis();
			}
		};

		socket.on('analysisUpdate', handleAnalysisUpdate);
		socket.on('analysisStreamEnded', handleStreamEnded);

		return () => {
			socket.off('analysisUpdate', handleAnalysisUpdate);
			socket.off('analysisStreamEnded', handleStreamEnded);
		};
	}, [inspectedUserId, setAnalysisTree, setCurrentPath, socket, match?.id, resetAnalysis]);

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

			const username = localStorage.getItem('username');
			socket.emit('joinAnalysisStream', { matchId: match?.id, userId, username });
		}
	}, [isAnalysisMode, hasExistingAnalysis, match, userId, socket, setAnalysisMode, setInspectedUserId, loadAnalysis]);

	const handleMainBoardClick = useCallback(async () => {
		let hasExistingAnalysisResult: boolean;
		const targetIdToLeave = inspectedUserId || userId;

		if (inspectedUserId) {
			// If we were inspecting, the 'hasExistingAnalysis' state for OUR OWN analysis remains unchanged
			hasExistingAnalysisResult = hasExistingAnalysis;
		} else if (userId && Object.keys(analysisTree).length === 0) {
			await discardAnalysis(match.id, userId);
			hasExistingAnalysisResult = false;
		} else {
			if (userId) {
				await saveDraft(match.id);
			}
			hasExistingAnalysisResult = true;
		}

		setSelectedMoveIndex(null);
		
		const prevInspectedUserId = inspectedUserId;
		const username = localStorage.getItem('username');

		resetAnalysis();

		if (match.id && targetIdToLeave) {
			socket.emit('leaveAnalysisStream', { 
				matchId: match.id, 
				userId: targetIdToLeave,
				username: prevInspectedUserId ? (document.querySelector(`button[data-username]`) as any)?.dataset.username : username // This is a bit hacky, better pass username directly
			});
		}

		return hasExistingAnalysisResult;
	}, [match?.id, userId, inspectedUserId, analysisTree, saveDraft, resetAnalysis, setSelectedMoveIndex, socket, discardAnalysis, hasExistingAnalysis]);

	const handleInspectUser = async (status: ViewerStatus | string) => {
		let username = typeof status === 'string' ? status : status.username;
		const result = await getPlayerByUsernameAction(username);

		if (!result.success || !result.data) {
			console.error(result.error);
			return;
		}

		const playerData = result.data;

		setInspectedUserId(playerData.userId);
		setAnalysisMode(true);

		if (match.id) {
			await loadAnalysis(match.id, playerData.userId);
			socket.emit('joinAnalysisStream', { 
				matchId: match.id, 
				userId: playerData.userId,
				username: username
			});
		}
	};

	return {
		handleInteractionOnMainBoard,
		handleMainBoardClick,
		handleInspectUser
	};
}