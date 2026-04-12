import { useEffect, useCallback } from "react";
import { useSocket } from "@/context/socket_context";
import { useAnalysisState } from "../context/analysis_context";
import { useAuth } from "@/hooks/use_auth";
import { Match, Move, MoveTreeNode } from "@/types/types";
import { getPlayerByUsernameAction } from "@/actions/analysis_actions";
import { ViewerStatus } from "./use_viewer_counts";

interface UseAnalysisSyncProps {
	match: Match;
	userId: number | null;
	hasExistingAnalysis: boolean;
	currentMoveData: Move | null;
}

export function useAnalysisSync({
	match,
	userId,
	hasExistingAnalysis,
	currentMoveData,
}: UseAnalysisSyncProps) {
	const {
		isAnalysisMode,
		inspectedUserId,
		inspectedUsername,
		setAnalysisMode,
		setInspectedUserId,
		setInspectedUsername,
		setAnalysisTree,
		currentPath,
		setCurrentPath,
		setSelectedMoveIndex,
		saveDraft,
		resetAnalysis,
		loadAnalysis,
		syncAnalysisToServer,
		analysisTree,
		discardAnalysis,
	} = useAnalysisState();

	const socket = useSocket();
	const { user } = useAuth();

	useEffect(() => {
		const handleAnalysisUpdate = (data: {
			matchId: string;
			userId: number;
			movesTree: Record<number, MoveTreeNode[]>;
			currentPath: number[];
		}) => {
			if (data.matchId === match?.id && data.userId === inspectedUserId) {
				if (data.movesTree) {
					setAnalysisTree({ ...data.movesTree });
				}
				// Do NOT update currentPath — inspector navigates independently.
			}
		};

		const handleStreamEnded = (_data: {
			matchId: string;
			username: string;
		}) => {
			// Inspector stays in inspection mode — the loaded analysis remains visible
			// even after the inspected user leaves analysis mode.
		};

		socket.on("analysisUpdate", handleAnalysisUpdate);
		socket.on("analysisStreamEnded", handleStreamEnded);

		return () => {
			socket.off("analysisUpdate", handleAnalysisUpdate);
			socket.off("analysisStreamEnded", handleStreamEnded);
		};
	}, [
		inspectedUserId,
		setAnalysisTree,
		socket,
		match?.id,
	]);

	useEffect(() => {
		if (isAnalysisMode && match?.id && userId && inspectedUserId === null) {
			syncAnalysisToServer(match.id, userId, undefined, currentPath);
		}
	}, [
		currentPath,
		isAnalysisMode,
		match?.id,
		userId,
		inspectedUserId,
		syncAnalysisToServer,
	]);

	const handleInteractionOnMainBoard = useCallback(
		async (type: "move" | "select") => {
			console.log("[use_analysis_sync.ts:handleInteractionOnMainBoard]", {
				type,
			});
			const canStart =
				(type === "move" && !hasExistingAnalysis) ||
				(type === "select" && hasExistingAnalysis);

			if (canStart && match && userId) {
				setAnalysisMode(true, currentMoveData?.fen);
				setInspectedUserId(null);
				setInspectedUsername(null);

				if (hasExistingAnalysis && match?.id && userId) {
					await loadAnalysis(match.id, userId);
				}

				socket.emit("joinAnalysisStream", {
					matchId: match?.id,
					userId,
					username: user?.username,
				});
			}
		},
		[
			hasExistingAnalysis,
			match,
			userId,
			socket,
			setAnalysisMode,
			setInspectedUserId,
			loadAnalysis,
			currentMoveData,
			user?.username,
		],
	);

	const handleMainBoardClick = useCallback(async () => {
		let hasExistingAnalysisResult: boolean;
		const targetIdToLeave = inspectedUserId || userId;

		if (inspectedUserId) {
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
		const username = user?.username || "";

		resetAnalysis();

		if (match.id && targetIdToLeave) {
			socket.emit("leaveAnalysisStream", {
				matchId: match.id,
				userId: targetIdToLeave,
				username: prevInspectedUserId
					? (document.querySelector(`button[data-username]`) as any)
							?.dataset.username
					: username,
			});
		}

		return hasExistingAnalysisResult;
	}, [
		match,
		userId,
		inspectedUserId,
		analysisTree,
		saveDraft,
		resetAnalysis,
		setSelectedMoveIndex,
		socket,
		discardAnalysis,
		hasExistingAnalysis,
		user?.username,
	]);

	const handleInspectUser = async (status: ViewerStatus | string) => {
		const username = typeof status === "string" ? status : status.username;
		const result = await getPlayerByUsernameAction(username);

		if (!result.success || !result.data) {
			console.error(result.error);
			return;
		}

		const playerData = result.data;

		setInspectedUserId(playerData.userId);
		setInspectedUsername(playerData.username);
		setAnalysisMode(true);

		if (match.id) {
			await loadAnalysis(match.id, playerData.userId);
			socket.emit("joinAnalysisStream", {
				matchId: match.id,
				userId: playerData.userId,
				username: username,
			});
		}
	};

	return {
		handleInteractionOnMainBoard,
		handleMainBoardClick,
		handleInspectUser,
	};
}
