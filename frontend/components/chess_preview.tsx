"use client";

import Chessground from '@bezalel6/react-chessground';
import { Match } from '@/types/types'
import { useBroadcast } from '@/hooks/use_broadcast';
import { useChessClock } from '@/hooks/use_chess_clocks';

export const ChessPreview = ({ match }: { match: Match }) => {
	const {currentMoveData, isEnded} = useBroadcast(match.id);
	// only start ticking when the match is officially in progress
	const isLive = match.status === "in_progress";
	const initialClockState = isLive
		? { 
			fen: match.fen, 
			whiteTimeMs: match.white.timeMs ?? match.timeControl * 1000, 
			blackTimeMs: match.black.timeMs ?? match.timeControl * 1000 
		}
		: null;
	const {whiteTimeFormatted, blackTimeFormatted} = useChessClock(
		isLive ? (currentMoveData ?? initialClockState) : null,
		match.timeControl*1000
	)
	return (
		<div className="relative aspect-square w-full bg-[#262421] p-2 flex flex-col justify-between">
			
			{/* Черный игрок (Сверху) */}
			<div className="flex justify-between items-center mb-1 px-1">
				<div className="flex items-center gap-2">
					<div className="w-5 h-5 bg-black border border-slate-600 rounded-sm" />
					<span className="text-[11px] font-medium text-slate-300">{match.black.name}</span>
				</div>
				<div className="bg-[#161512] px-2 py-0.5 rounded text-[12px] font-mono text-slate-400">
					{blackTimeFormatted}
				</div>
			</div>

			{/* Сама доска (реальный компонент) */}
			<div className="flex-1 flex items-center justify-center">
				<div className="w-full aspect-square max-h-full bg-[#b58863] relative rounded-sm overflow-hidden border border-[#3c3a37]">
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

			{/* Белый игрок (Снизу) */}
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