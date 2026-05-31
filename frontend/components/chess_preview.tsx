"use client";

import Chessground from "@bezalel6/react-chessground";
import { Match } from "@/types/types";
import { useBroadcast } from "@/hooks/use_broadcast";
import { useChessClock } from "@/hooks/use_chess_clocks";
import { EvalBar } from "./eval_bar";
import Link from "next/link";
import { useProcessing } from "@/hooks/use_processing";

export const ChessPreview = ({
	match,
	isEmbedded,
}: {
	match: Match;
	isEmbedded?: boolean;
}) => {
	console.log("[chess_preview.tsx:ChessPreview]", { matchId: match.id });
	const { isProcessing } = useProcessing(match);
	const { currentMoveData, isEnded } = useBroadcast(match.id);
	const finalIsEnded = isEnded || match.status === "finished";
	const { whiteTimeFormatted, blackTimeFormatted } = useChessClock(
		currentMoveData,
		match.timeControl * 1000,
		match.status !== "in_progress"
	);

	const Wrapper = isEmbedded || isProcessing ? "div" : Link;
	const wrapperProps = isEmbedded || isProcessing
		? {}
		: { href: `/watch/${match.id}?paraboards` };

	const evaluations = currentMoveData?.evaluations || match.evaluations || [];
	const currentEval =
		evaluations.length > 0 ? evaluations[evaluations.length - 1] : 0;

	return (
		// @ts-expect-error Type error is impossible here
		<Wrapper
			{...wrapperProps}
			className={`relative aspect-square w-full bg-stone-800 p-2 flex flex-col justify-between rounded 
				${isProcessing ? "cursor-not-allowed" : ""}`}
		>
			<div className="flex justify-between items-center mb-1 px-1">
				<div className="flex items-center gap-2">
					<span className="text-[11px] font-medium text-slate-300">
						{match.blackPlayer}
					</span>
				</div>
				<div
					className={`${currentMoveData?.turn == "b" && !finalIsEnded ? "bg-white text-black font-bold" : "bg-stone-900 text-slate-400"} px-2 py-0.5 rounded text-[12px] font-mono`}
				>
					{blackTimeFormatted}
				</div>
			</div>

			<div className="relative flex-1 pl-4">
				<div className="absolute top-0 left-0 h-full w-3 rounded-[1px] overflow-hidden border border-stone-600 opacity-90">
					<EvalBar
						evaluation={currentEval}
						isWhite={true}
						hideText={true}
					/>
				</div>

				<div className="w-full h-full aspect-square bg-oak relative rounded-sm overflow-hidden border border-stone-600">
					<div className="absolute inset-0">
						<Chessground
							fen={currentMoveData?.fen ?? match.fen}
							viewOnly={true}
							coordinates={false}
							width={"100%"}
							height={"100%"}
						/>
					</div>
				</div>
			</div>

			<div className="flex justify-between items-center mt-1 px-1">
				<div className="flex items-center gap-2">
					<span className="text-[11px] font-medium text-white">
						{match.whitePlayer}
					</span>
				</div>
				<div
					className={`${currentMoveData?.turn == "w" && !finalIsEnded ? "bg-white text-black font-bold" : "bg-stone-900 text-slate-400"} px-2 py-0.5 rounded text-[12px] font-mono`}
				>
					{whiteTimeFormatted}
				</div>
			</div>
			{isProcessing &&
				<div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/60 backdrop-blur-[1px] animate-in fade-in duration-300">
					<svg
						className="w-12 h-12 text-[#b58863] animate-spin"
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
					>
						<circle
							className="opacity-25"
							cx="12"
							cy="12"
							r="10"
							stroke="currentColor"
							strokeWidth="4"
						></circle>
						<path
							className="opacity-75"
							fill="currentColor"
							d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
						></path>
					</svg>
					<span className="mt-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[#b58863]/80">
						Processing...
					</span>
				</div>
			}
		</Wrapper>
		
	);
};
