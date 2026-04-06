"use client";

import Chessground from '@bezalel6/react-chessground';
import { Match } from '@/types/types'
import { useBroadcast } from '@/hooks/use_broadcast';
import { useChessClock } from '@/hooks/use_chess_clocks';
import { useFollowMatch } from '@/hooks/use_follow_match';
import { EvalBar } from './eval_bar';

export const ChessPreview = ({ match }: { match: Match }) => {
	console.log("[chess_preview.tsx:ChessPreview]", { matchId: match.id });
	const {currentMoveData, isEnded} = useBroadcast(match.id);
	const isLive = match.status === "in_progress";
	const {whiteTimeFormatted, blackTimeFormatted} = useChessClock(
		isLive ? currentMoveData : null,
		match.timeControl*1000
	);
	const { isFollowing, isLoading, toggleFollow } = useFollowMatch(match.id);

	const handleFollowClick = (e: React.MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();
		toggleFollow();
	};
	const evaluations = currentMoveData?.evaluations || match.evaluations || [];
	const currentEval = evaluations.length > 0 ? evaluations[evaluations.length - 1] : 0;
	return (
		<div className="relative aspect-square w-full bg-[#262421] p-2 flex flex-col justify-between">

			<button
				onClick={handleFollowClick}
				disabled={isLoading}
				className="absolute top-1 right-1 z-10 p-1 rounded hover:bg-white/10 transition-colors disabled:opacity-50"
				title={isFollowing ? "Unfollow match" : "Follow match"}
			>
				<svg width="16" height="16" viewBox="0 0 24 24" fill={isFollowing ? "#fbbf24" : "none"} stroke="#fbbf24" strokeWidth="2" className="block">
					<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
				</svg>
			</button>

			<div className="flex justify-between items-center mb-1 px-1">
				<div className="flex items-center gap-2">
					<div className="w-5 h-5 bg-black border border-slate-600 rounded-sm" />
					<span className="text-[11px] font-medium text-slate-300">{match.black.name}</span>
				</div>
				<div className="bg-[#161512] px-2 py-0.5 rounded text-[12px] font-mono text-slate-400">
					{blackTimeFormatted}
				</div>
			</div>

			<div className="relative flex-1 pl-4">
				
				<div className="absolute top-0 left-0 h-full w-3 rounded-[1px] overflow-hidden border border-[#3c3a37] opacity-90">
					<EvalBar evaluation={currentEval} isWhite={true} hideText={true} />
				</div>

				<div className="w-full h-full aspect-square bg-[#b58863] relative rounded-sm overflow-hidden border border-[#3c3a37]">
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
					<div className="w-5 h-5 bg-white border border-slate-300 rounded-sm" />
					<span className="text-[11px] font-medium text-white">{match.white.name}</span>
				</div>
				<div className="bg-white px-2 py-0.5 rounded text-[12px] font-mono text-black font-bold">
					{whiteTimeFormatted}
				</div>
			</div>
		</div>
	);
};