'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
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
		setSelectedMoveIndex,
		saveAnalysis,
		discardAnalysis,
		loadAnalysis,
	} = useAnalysisState();

	const [showBeginPrompt, setShowBeginPrompt] = useState(false);
	const [showSavePrompt, setShowSavePrompt] = useState(false);

	const socketRef = useRef<Socket | null>(null);

	useEffect(() => {
		socketRef.current = io(process.env.NEXT_PUBLIC_SOCKET_URL, {
			transports: ['websocket'],
		});

		const handleAnalysisUpdate = (data: { movesTree: any }) => {
			if (inspectedUserId && data.movesTree) {
				setAnalysisTree(data.movesTree);
			}
		};

		socketRef.current.on('analysis_update', handleAnalysisUpdate);

		return () => {
			if (socketRef.current) {
				socketRef.current.off('analysis_update', handleAnalysisUpdate);
				socketRef.current.disconnect();
			}
		};
	}, [inspectedUserId, setAnalysisTree]);

	const handleMoveOnMainBoard = useCallback(() => {
		setSelectedMoveIndex(null);
		if (!isAnalysisMode && !showBeginPrompt && match && userId) {
			setShowBeginPrompt(true);
		}
	}, [isAnalysisMode, showBeginPrompt, match, userId, setSelectedMoveIndex]);

	const handleMainBoardClick = useCallback(() => {
		setSelectedMoveIndex(null);
		setShowSavePrompt(true);
	}, [setSelectedMoveIndex]);

	const handleBeginAnalysis = async () => {
		setShowBeginPrompt(false);
		setAnalysisMode(true);
		setInspectedUserId(null);

		if (hasExistingAnalysis && match?.id && userId) {
			await loadAnalysis(match.id, userId);
		}

		socketRef.current?.emit('joinAnalysisStream', { matchId: match?.id, userId });
	};

	const handleSave = async () => {
		setShowSavePrompt(false);
		if (match?.id && userId) {
			await saveAnalysis(match.id, userId);
			socketRef.current?.emit('leaveAnalysisStream', { matchId: match.id, userId });
		}
	};

	const handleDiscard = async () => {
		setShowSavePrompt(false);
		if (match?.id && userId) {
			await discardAnalysis(match.id, userId);
			socketRef.current?.emit('leaveAnalysisStream', { matchId: match.id, userId });
		}
	};

	const handleInspectUser = async (username: string) => {
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
			socketRef.current?.emit('joinAnalysisStream', { 
				matchId: match.id, 
				userId: playerData.userId 
			});
		}
	};

	return {
		showBeginPrompt,
		setShowBeginPrompt,
		showSavePrompt,
		setShowSavePrompt,
		handleMoveOnMainBoard,
		handleMainBoardClick,
		handleBeginAnalysis,
		handleSave,
		handleDiscard,
		handleInspectUser
	};
}