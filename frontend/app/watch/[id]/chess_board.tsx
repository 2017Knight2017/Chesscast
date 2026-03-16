'use client';

import { useState, useRef, useMemo, memo } from 'react';
import { useBroadcast } from '@/hooks/use_broadcast';
import { useChessClock } from '@/hooks/use_chess_clocks';
import { useKeyboardNavigation } from '@/hooks/use_keyboard_navigation';
import Chessground from '@bezalel6/react-chessground';
import { Match } from '@/types/types';
import { useAnalysis } from '@/context/analysis_context';
import { Chess } from 'chess.js'
import { SyncPayload } from '@/types/types';

const ChessTimer = memo(({ data, initial, label }: { data: SyncPayload|null, initial: number, label: "White"|"Black" }) => {
	const { whiteTimeFormatted, blackTimeFormatted } = useChessClock(data, initial); 
	const whiteStyles = [
		"flex items-center gap-3 bg-[#f1f1f1] px-4 py-1.5 rounded-b-md border-b border-x border-[#3c3a33] shadow-xl",
		"text-xs uppercase text-slate-400 font-bold tracking-widest",
		"text-xl font-mono font-bold text-black min-w-20 text-right"
	]
	const blackStyles = [
		"flex items-center gap-3 bg-[#262421] px-4 py-1.5 rounded-t-md border-t border-x border-[#3c3a33] shadow-xl",
		"text-xs uppercase text-slate-500 font-bold tracking-widest",
		"text-xl font-mono font-bold text-white min-w-20 text-right"
	]
	const time = label === 'White' ? whiteTimeFormatted : blackTimeFormatted;
	const styles = label === "White" ? whiteStyles : blackStyles;
	return (
		<div className={styles[0]}>
			<span className={styles[1]}>{label}</span>
			<span className={styles[2]}>
				{time}
			</span>
		</div>
	);
});

export function ChessBoard({ onInteraction, match, isOnMove=false }: { onInteraction: () => void, match: Match, isOnMove?: boolean }) {
	const { selectedMoveIndex } = useAnalysis();
	const previewMove = selectedMoveIndex ?? undefined;

	const containerRef = useRef<HTMLDivElement>(null);

	const { currentMoveData, isEnded } = useBroadcast(match.id);
	const totalMoves = currentMoveData?.history?.length || 0;
    useKeyboardNavigation(totalMoves);

	const [isManualStarted, setIsManualStarted] = useState<boolean>(false);
	const isBroadcastActive = match.status === "in_progress" || isManualStarted;
	const finalIsEnded = match.status === "finished" || isEnded;

	const activeFen = (currentMoveData && currentMoveData.fen) || match.fen;
	const fenCache = useRef<string[]>([]);
	const fenHistory = useMemo(() => {
		const history = currentMoveData?.history || [];
		const cache = fenCache.current;

		if (history.length === cache.length) return cache;

		const tempChess = new Chess();
		if (history.length < cache.length) {
			fenCache.current = [];
		}

		const newHistory = history.map((move) => {
			tempChess.move(move);
			return tempChess.fen();
		});
		
		fenCache.current = newHistory;
		return newHistory;
	}, [currentMoveData?.history]);

	const previewFen = useMemo(() => {
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
		setIsManualStarted(true);
		await fetch(process.env.NEXT_PUBLIC_SOCKET_URL + `/matches/${match.id}/start`, { method: 'POST' });
	};

	const clockData = isBroadcastActive ? currentMoveData : null;
	const initialTime = match.timeControl * 1000;
		
	return (
		<div ref={containerRef} className='relative w-full h-full flex justify-center items-center flex-col sepia-100 brightness-75 contrast-125'>
			<div className="absolute -top-12 right-0 z-10">
				<ChessTimer data={clockData} initial={initialTime} label="Black" />
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
				onSelect={isOnMove ? ()=>{} : onInteraction}
				onMove={isOnMove ? onInteraction : ()=>{}}
				key={match.id}
				fen={previewFen || activeFen}
				viewOnly={false}
				width="100%"
				height="100%"
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
				<ChessTimer data={clockData} initial={initialTime} label="White" />
			</div>
		</div>
	);
}