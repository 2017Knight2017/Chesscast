"use client";

import Chessground from "@bezalel6/react-chessground";
import { Match } from "@/types/types";
import { useBroadcast } from "@/hooks/use_broadcast";
import { useChessClock } from "@/hooks/use_chess_clocks";
import { EvalBar } from "./eval_bar";
import Link from "next/link";

export const ChessPreview = ({
	match,
	isEmbedded,
}: {
	match: Match;
	isEmbedded?: boolean;
}) => {
	console.log("[chess_preview.tsx:ChessPreview]", { matchId: match.id });
	const { currentMoveData, isEnded } = useBroadcast(match.id);
	const finalIsEnded = isEnded || match.status === "finished";
	const { whiteTimeFormatted, blackTimeFormatted } = useChessClock(
		currentMoveData,
		match.timeControl * 1000,
		true
	);

	const Wrapper = isEmbedded ? "div" : Link;
	const wrapperProps = isEmbedded
		? {}
		: { href: `/watch/${match.id}?paraboards` };

	const evaluations = currentMoveData?.evaluations || match.evaluations || [];
	const currentEval =
		evaluations.length > 0 ? evaluations[evaluations.length - 1] : 0;

	return (
		// @ts-expect-error Type error is impossible here
		<Wrapper
			{...wrapperProps}
			className="relative aspect-square w-full bg-stone-800 p-2 flex flex-col justify-between rounded"
		>
			<div className="flex justify-between items-center mb-1 px-1">
				<div className="flex items-center gap-2">
					<span className="text-[11px] font-medium text-slate-300">
						{match.black.name}
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
						{match.white.name}
					</span>
				</div>
				<div
					className={`${currentMoveData?.turn == "w" && !finalIsEnded ? "bg-white text-black font-bold" : "bg-stone-900 text-slate-400"} px-2 py-0.5 rounded text-[12px] font-mono`}
				>
					{whiteTimeFormatted}
				</div>
			</div>
		</Wrapper>
	);
};
