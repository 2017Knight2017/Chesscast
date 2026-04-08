"use client";

import { useRef, useMemo, memo, Dispatch, SetStateAction } from "react";
import { useChessClock } from "@/hooks/use_chess_clocks";
import { useKeyboardNavigation } from "@/hooks/use_keyboard_navigation";
import Chessground from "@bezalel6/react-chessground";
import { Match, Move, SyncPayload } from "@/types/types";
import { useAnalysisState } from "@/context/analysis_context";
import { Chess } from "chess.js";
import { launchMatchAction } from "@/actions/match_actions";
import { EvalBar } from "@/components/eval_bar";

interface ChessBoardProps {
	onMove?: (orig: string, dest: string) => void;
	onSelect?: (key: string) => void;
	setIsOverlayVisible: Dispatch<SetStateAction<boolean>>;
	setIsManualStarted: Dispatch<SetStateAction<boolean>>;
	isOverlayVisible: boolean;
	isManualStarted: boolean;
	isBroadcastActive: boolean;
	finalIsEnded: boolean;
	match: Match;
	currentMoveData: Move;
	outcome: string | undefined;
	hideTimers?: boolean;
}

interface ChessTimerProps {
	data: SyncPayload | null;
	initial: number;
	isWhite: boolean;
	playerName: string;
	isAnalysisMode: boolean;
	isPaused?: boolean;
}

const ChessTimer = memo(function ChessTimer({
	data,
	initial,
	isWhite,
	playerName,
	isAnalysisMode,
	isPaused,
}: ChessTimerProps) {
	const { whiteTimeFormatted, blackTimeFormatted } = useChessClock(
		data,
		initial,
		isPaused,
	);

	const time = isWhite ? whiteTimeFormatted : blackTimeFormatted;

	const renderTime = () => {
		if (!isAnalysisMode) return time;

		const parts = time.split(":");
		const elements: React.ReactNode[] = [];

		parts.forEach((part, index) => {
			elements.push(
				<span
					key={`part-${index}`}
					className="leading-tight block text-center w-full"
				>
					{part}
				</span>,
			);

			if (index < parts.length - 1)
				elements.push(
					<span
						key={`sep-${index}`}
						className="leading-[0.5] block text-center w-full opacity-50"
					>
						··
					</span>,
				);
		});

		return elements;
	};

	const baseContainer =
		"flex transition-all duration-300 shadow-xl border-[#3c3a33] items-center";
	const colorStyles = isWhite ? "bg-[#f1f1f1]" : "bg-[#262421]";

	const orientationClasses = isAnalysisMode
		? `flex-col py-4 w-10 gap-4 lg:flex-col lg:py-4 lg:w-10 lg:gap-4 ${isWhite ? "rounded-r-md border-r border-y" : "rounded-l-md border-l border-y"}`
		: `flex-row px-4 py-1 items-center gap-3 lg:px-4 lg:py-1.5 lg:gap-3 ${isWhite ? "rounded-b-md border-b border-x" : "rounded-t-md border-t border-x"}`;

	return (
		<div
			className={`${baseContainer} ${colorStyles} ${orientationClasses}`}
		>
			<span
				className={`text-[13px] font-bold tracking-wider uppercase ${isAnalysisMode ? "flex flex-col items-center leading-none" : ""} ${isWhite ? "text-slate-400" : "text-slate-500"}`}
			>
				{isAnalysisMode
					? playerName
							.split(" ")
							.at(-1)!
							.split("")
							.map((l, i) => <span key={i}>{l}</span>)
					: playerName}
			</span>

			<span
				className={`font-mono font-bold text-center ${isAnalysisMode ? "flex flex-col text-sm items-center gap-0.5" : "text-lg lg:text-xl min-w-16 lg:min-w-20"} ${isWhite ? "text-black" : "text-white"}`}
			>
				{renderTime()}
			</span>
		</div>
	);
});

export function ChessBoard({
	onMove,
	onSelect,
	setIsOverlayVisible,
	isOverlayVisible,
	setIsManualStarted,
	isManualStarted,
	isBroadcastActive,
	finalIsEnded,
	match,
	currentMoveData,
	outcome,
	hideTimers = false,
}: ChessBoardProps) {
	console.log("[watch/[id]/chess_board.tsx:ChessBoard]", {
		onMove,
		onSelect,
		isManualStarted,
		isBroadcastActive,
		finalIsEnded,
		match,
		currentMoveData,
		outcome,
		hideTimers,
	});

	const { selectedMoveIndex, isAnalysisMode } = useAnalysisState();
	const previewMove = isAnalysisMode
		? undefined
		: (selectedMoveIndex ?? undefined);

	const containerRef = useRef<HTMLDivElement>(null);

	const totalMoves = currentMoveData?.history?.length || 0;

	useKeyboardNavigation(totalMoves);

	const activeFen = currentMoveData.fen;
	const fenHistory = useMemo(() => {
		console.log("[watch/[id]/chess_board.tsx:fenHistory]");
		const history = currentMoveData?.history || [];

		const tempChess = new Chess();
		return history.map((move) => {
			try {
				tempChess.move(move);
			} catch {}
			return tempChess.fen();
		});
	}, [currentMoveData]);

	const previewFen = useMemo(() => {
		console.log("[watch/[id]/chess_board.tsx:previewFen]");
		if (previewMove !== null && previewMove !== undefined) {
			if (previewMove === -1) {
				return "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
			}

			if (fenHistory[previewMove]) {
				return fenHistory[previewMove];
			}
		}
		return null;
	}, [previewMove, fenHistory]);

	const handleStart = async () => {
		console.log("[watch/[id]/chess_board.tsx:handleStart]");
		setIsManualStarted(true);
		await launchMatchAction(match.id);
	};

	const initialTime = match.timeControl * 1000;
	const isPaused = !isBroadcastActive;

	const clockData = useMemo(() => {
		if (isBroadcastActive) return currentMoveData; 

		console.log(currentMoveData.history);

		if (selectedMoveIndex !== null && selectedMoveIndex !== undefined) {
			const idx = selectedMoveIndex;
			const timesRemaining = currentMoveData?.timesRemaining || [];

			if (idx === -1) {
				return {
					fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
					whiteTimeMs: initialTime,
					blackTimeMs: initialTime,
					newestMoveAt: 0,
				};
			}

			const currentTime = timesRemaining[idx] ?? initialTime;
			const previousTime = timesRemaining[idx - 1] ?? initialTime;

			const isWhiteTurn = idx % 2 === 0;

			const whiteTime = isWhiteTurn ? currentTime : previousTime;
			const blackTime = isWhiteTurn ? previousTime : currentTime;

			console.log(timesRemaining);

			return {
				fen: fenHistory[idx] || activeFen,
				whiteTimeMs: whiteTime,
				blackTimeMs: blackTime,
				newestMoveAt: 0,
			};
		}

		return currentMoveData;
	}, [
		isBroadcastActive,
		currentMoveData,
		selectedMoveIndex,
		initialTime,
		fenHistory,
		activeFen,
	]);

	const currentEval = useMemo(() => {
		const evals = currentMoveData?.evaluations || [];

		if (
			selectedMoveIndex !== null &&
			selectedMoveIndex !== undefined &&
			!isAnalysisMode
		) {
			if (selectedMoveIndex === -1) return 0;
			return evals[selectedMoveIndex] ?? 0;
		}

		return evals.length > 0 ? evals[evals.length - 1] : 0;
	}, [currentMoveData, selectedMoveIndex, isAnalysisMode]);

	let outcomeMessage;
	switch (outcome) {
		case "1/2-1/2":
			outcomeMessage = "Draw!";
			break;
		case "1-0":
			outcomeMessage = "White wins!";
			break;
		case "0-1":
			outcomeMessage = "Black wins!";
			break;
	}

	return (
		<div
			ref={containerRef}
			className="relative w-full h-full flex justify-center items-center flex-col sepia-100 brightness-75 contrast-125"
		>
			{!hideTimers && (
				<div
					className={`absolute z-10 flex items-center gap-3 transition-all duration-300 ${isAnalysisMode ? "top-0 -left-6 lg:-left-11" : "-top-10 lg:-top-12 left-0"}`}
				>
					<ChessTimer
						data={clockData}
						initial={initialTime}
						isWhite={false}
						playerName={match.black.name}
						isAnalysisMode={isAnalysisMode}
						isPaused={isPaused}
					/>
				</div>
			)}
			<div className="relative w-full h-full flex gap-2 md:gap-3">
				<div className="relative w-full h-full overflow-hidden rounded-md border border-[#8b5e34]/20 shadow-lg">
					{!(
						isBroadcastActive ||
						finalIsEnded ||
						isManualStarted
					) && (
						<button
							className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 p-3 z-10 border-4 rounded-lg bg-amber-900 border-amber-700 hover:bg-amber-800 hover:border-amber-600"
							onClick={() => handleStart()}
						>
							<span className="text-gray-300 font-sans">
								Start broadcast
							</span>
						</button>
					)}

					{finalIsEnded && isOverlayVisible && (
						<div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 p-4 z-30 rounded-lg bg-amber-900/95 border border-amber-600 text-center min-w-55 shadow-2xl backdrop-blur-sm">
							<button
								onClick={() => setIsOverlayVisible(false)}
								className="absolute -top-2 -right-2 bg-amber-700 hover:bg-amber-600 text-white w-6 h-6 rounded-full flex items-center justify-center border border-amber-500 shadow-md transition-colors"
							>
								<span className="text-xs">✕</span>
							</button>

							<div className="flex flex-col gap-2">
								<span className="text-amber-200 text-xs uppercase tracking-widest font-bold">
									Game Over
								</span>
								<span className="pb-2 text-gray-100 font-bold text-xl lg:text-2xl font-sans whitespace-pre-line leading-tight">
									{outcomeMessage}
								</span>
								<button
									onClick={() => setIsOverlayVisible(false)}
									className="group relative px-4 py-2.5 bg-transparent border border-amber-600/40 hover:border-amber-500 text-amber-100 rounded-lg transition-all duration-200 active:scale-95 overflow-hidden"
								>
									<div className="absolute inset-0 bg-amber-600/0 group-hover:bg-amber-600/10 transition-colors" />

									<span className="relative text-sm font-semibold tracking-wide">
										Review position
									</span>
								</button>
							</div>
						</div>
					)}

					<Chessground
						onSelect={onSelect}
						onMove={onMove}
						key={match.id}
						fen={previewFen || activeFen}
						viewOnly={false}
						width="100%"
						height="100%"
						coordinates={false}
						movable={{ free: true, color: "both" }}
						animation={{ enabled: true, duration: 500 }}
					/>
				</div>
				{!hideTimers && (
					<div
						className={`absolute rounded-md overflow-hidden border border-[#8b5e34]/20 shadow-xl z-10 transition-all duration-300
						${
							isAnalysisMode
								? "-bottom-6 left-0 w-full h-6"
								: "top-0 -right-8 h-full w-8"
						}`}
					>
						<EvalBar
							evaluation={currentEval}
							isWhite={true}
							isHorizontal={isAnalysisMode}
						/>
					</div>
				)}
			</div>
			{!hideTimers && (
				<div
					className={`absolute z-10 flex items-center gap-2 transition-all duration-300 ${isAnalysisMode ? "bottom-0 -right-6 lg:-right-11" : "-bottom-10 lg:-bottom-12 right-0"}`}
				>
					<ChessTimer
						data={clockData}
						initial={initialTime}
						isWhite={true}
						playerName={match.white.name}
						isAnalysisMode={isAnalysisMode}
						isPaused={isPaused}
					/>
				</div>
			)}
		</div>
	);
}
