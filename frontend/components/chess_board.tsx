'use client';

import { useState, useEffect, useRef } from 'react';
import { useBroadcast } from '@/hooks/use_broadcast';
import { useChessClock } from '@/hooks/use_chess_clocks';
import Chessground from '@bezalel6/react-chessground';
import { Match } from '@/types/types';

export function ChessBoard({ match }: { match: Match }) {
	const containerRef = useRef<HTMLDivElement>(null);

	const { currentMoveData, isEnded } = useBroadcast(match.id);
	const [isManualStarted, setIsManualStarted] = useState<boolean>(false);

	const isBroadcastActive = match.status === "in_progress" || isManualStarted;

	const initialClockState = isBroadcastActive
		? {
			fen: match.fen,
			whiteTimeMs: (match.white.timeMs ?? match.timeControl * 1000),
			blackTimeMs: (match.black.timeMs ?? match.timeControl * 1000),
		}
		: null;

	const { whiteTimeFormatted, blackTimeFormatted } = useChessClock(
		isBroadcastActive ? (currentMoveData ?? initialClockState) : null,
		match.timeControl * 1000
	);
	const activeFen = (currentMoveData && currentMoveData.fen) || match.fen;

	const finalIsEnded = match.status === "finished" || isEnded;

	useEffect(() => {
		if (currentMoveData?.fen) {
			window.dispatchEvent(new Event('resize'));
		}
	}, [currentMoveData?.fen]);

	const handleStart = async () => {
		setIsManualStarted(true);
		await fetch(process.env.NEXT_PUBLIC_SOCKET_URL + `/matches/${match.id}/start`, { method: 'POST' });
	};
		
	return (
		<div ref={containerRef} className='relative w-full h-full flex justify-center items-center flex-col sepia-100 brightness-75 contrast-125'>
			{/* ТАЙМЕР ЧЕРНЫХ: абсолютно сверху-справа */}
			<div className="absolute -top-12 right-0 z-10">
				<div className="flex items-center gap-3 bg-[#262421] px-4 py-1.5 rounded-t-md border-t border-x border-[#3c3a33] shadow-xl">
					<span className="text-xs uppercase text-slate-500 font-bold tracking-wmatch.idest">Black</span>
					<span className="text-xl font-mono font-bold text-white min-w-20 text-right">
						{blackTimeFormatted}
					</span>
				</div>
			</div>
			{!isBroadcastActive && !finalIsEnded &&
				<button className='absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 p-3 z-10 border-4 rounded-lg bg-amber-900 border-amber-700 hover:bg-amber-800 hover:border-amber-600 ' onClick={() => handleStart()}>
					<span className='text-gray-300 font-sans'>Start broadcast</span>
				</button>
			}
			{finalIsEnded && (
				<div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 p-3 z-10 rounded-lg bg-amber-900 border-amber-700">
					<span className='text-gray-300 font-bold text-2xl font-sans'>Broadcast is over!</span>
				</div>
			)}
			<Chessground
				key={currentMoveData ? "live" : "static"}
				fen={activeFen}
				viewOnly={false}
				width={"100%"}
				height={"100%"}
				coordinates={false}
				movable={{
					free: true,
					color: "both"
				}}
				animation={{
					enabled: true,
					duration: 500
				}}
			/>
			<div className="absolute -bottom-12 right-0 z-10">
				<div className="flex items-center gap-3 bg-[#f1f1f1] px-4 py-1.5 rounded-b-md border-b border-x border-[#3c3a33] shadow-xl">
					<span className="text-xs uppercase text-slate-400 font-bold tracking-wmatch.idest">White</span>
					<span className="text-xl font-mono font-bold text-black min-w-20 text-right">
						{whiteTimeFormatted}
					</span>
				</div>
			</div>
		</div>
	);
}