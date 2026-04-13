"use client";

import {
	forwardRef,
	useImperativeHandle,
	useMemo,
	useEffect,
	useRef,
} from "react";
import Chessground from "@bezalel6/react-chessground";
import { Chess } from "chess.js";
import { useAnalysisState } from "@/context/analysis_context";
import { EvalBar } from "@/components/eval_bar";

interface UserAnalysisBoardProps {
	matchId: string;
	userId: number | null;
	matchHistory: string[];
	currentFen: string;
	evals: number[];
	onMove?: (move: string) => void;
}

export interface UserAnalysisBoardRef {
	getCurrentFen: () => string;
}

export const UserAnalysisBoard = forwardRef<
	UserAnalysisBoardRef,
	UserAnalysisBoardProps
>(function UserAnalysisBoard({ matchHistory, currentFen, onMove, evals }, ref) {
	const {
		analysisTree,
		addMoveToTree,
		currentPath,
		inspectedUserId,
		inspectedUsername,
		selectedMoveIndex,
		setSelectedMoveIndex,
		isAnalysisMode,
	} = useAnalysisState();

	const chessRef = useRef(new Chess(currentFen));

	const isReadOnly = inspectedUserId !== null;

	const effectiveMainline = useMemo(() => {
		if (!isAnalysisMode || inspectedUserId === null) {
			return matchHistory;
		}

		const moves: string[] = [];
		const startKey = analysisTree[-1]?.length > 0 ? -1 : 0;

		if (analysisTree[startKey]?.length > 0) {
			if (startKey > 0) {
				for (let i = 0; i < startKey; i++) {
					if (matchHistory[i]) {
						moves.push(matchHistory[i]);
					}
				}
			}

			let currentLevel = analysisTree[startKey];
			while (currentLevel && currentLevel.length > 0) {
				const node = currentLevel[0];
				moves.push(node.m);
				currentLevel = node.s || [];
			}
		} else {
			return matchHistory;
		}

		return moves;
	}, [isAnalysisMode, inspectedUserId, analysisTree, matchHistory]);

	const boardHistory = effectiveMainline;

	useEffect(() => {
		chessRef.current = new Chess(currentFen);
	}, [currentFen]);

	const computedChess = useMemo(() => {
		const chess = new Chess();

		const branchPoint =
			selectedMoveIndex !== null
				? Math.max(
						-1,
						Math.min(selectedMoveIndex, boardHistory.length - 1),
					)
				: isReadOnly
					? 0
					: boardHistory.length - 1;

		for (let i = 0; i <= branchPoint; i++) {
			if (boardHistory[i]) {
				try {
					chess.move(boardHistory[i]);
				} catch (error) {
					console.error(
						"Failed to apply history move",
						boardHistory[i],
						error,
					);
				}
			}
		}

		if (currentPath.length > 0 && analysisTree[branchPoint]) {
			let currentLevel = analysisTree[branchPoint];
			for (const idx of currentPath) {
				if (currentLevel && currentLevel[idx]) {
					try {
						chess.move(currentLevel[idx].m);
						currentLevel = currentLevel[idx].s || [];
					} catch {
						break;
					}
				} else {
					break;
				}
			}
		}

		return chess;
	}, [analysisTree, currentPath, selectedMoveIndex, boardHistory]);

	const computedFen = computedChess.fen();

	const { broadcastFen } = useAnalysisState();

	useEffect(() => {
		if (!isReadOnly) {
			broadcastFen(computedFen);
		}
	}, [computedFen, isReadOnly, broadcastFen]);

	useImperativeHandle(ref, () => ({
		getCurrentFen: () => computedFen,
	}));

	const handleMove = (orig: string, dest: string) => {
		console.log("[watch/[id]/user_analysis_board.tsx:handleMove]", {
			orig,
			dest,
		});
		if (isReadOnly) return;

		const chess = new Chess(computedFen);
		const move = chess.move({ from: orig, to: dest, promotion: "q" });

		if (move) {
			const branchPoint =
				selectedMoveIndex !== null
					? selectedMoveIndex
					: boardHistory.length - 1;

			if (selectedMoveIndex === null) {
				setSelectedMoveIndex(branchPoint);
			}

			addMoveToTree(move.san, branchPoint, currentPath);
			onMove?.(move.san);
		}
	};

	const movableObj = useMemo(() => {
		const dests = new Map();
		const board = computedChess.board().flat();

		board.forEach((piece) => {
			if (piece && piece.color === computedChess.turn()) {
				const moves = computedChess.moves({
					square: piece.square,
					verbose: true,
				});
				if (moves.length) {
					dests.set(
						piece.square,
						moves.map((m) => m.to),
					);
				}
			}
		});

		return {
			free: false,
			showDests: true,
			dests: dests,
			color: "both" as const,
		};
	}, [computedChess]);

	const currentEval = useMemo(() => {
		if (selectedMoveIndex !== null && selectedMoveIndex !== undefined) {
			if (selectedMoveIndex === -1) return 0;
			return evals[selectedMoveIndex] ?? 0;
		}

		return evals.length > 0 ? evals[evals.length - 1] : 0;
	}, [evals, selectedMoveIndex]);

	return (
		<div className="relative w-full h-full rounded-md flex justify-center items-center">
			{inspectedUsername && (
				<h3 className="absolute -top-10 left-0 px-3 py-1 bg-stone-900/90 text-orange-200 text-[10px] sm:text-xs font-bold uppercase tracking-[0.2em] rounded-t-sm border-l-3 border-oak shadow-lg backdrop-blur-sm">
				    <span className="opacity-60 mr-1">Inspecting:</span> 
				    <span>{inspectedUsername}</span>
				</h3>
			)}

			<Chessground
				onMove={handleMove}
				fen={computedFen}
				viewOnly={isReadOnly}
				width="100%"
				height="100%"
				coordinates={true}
				movable={movableObj}
				premovable={{ enabled: false }}
				animation={{
					enabled: true,
					duration: 300,
				}}
			/>

			<div className="absolute top-0 -right-8 h-full w-8 rounded-md overflow-hidden border border-[#8b5e34]/20 shadow-xl z-10 transition-all duration-300">
				<EvalBar evaluation={currentEval} isWhite={true} />
			</div>
		</div>
	);
});
