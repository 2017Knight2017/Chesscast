'use client';

import { useState, useRef, useMemo, memo, Dispatch, SetStateAction } from 'react';
import { useBroadcast } from '@/hooks/use_broadcast';
import { useChessClock } from '@/hooks/use_chess_clocks';
import { useKeyboardNavigation } from '@/hooks/use_keyboard_navigation';
import Chessground from '@bezalel6/react-chessground';
import { Match, Move } from '@/types/types';
import { useAnalysisState } from '@/context/analysis_context';
import { Chess } from 'chess.js'
import { SyncPayload } from '@/types/types';

const ChessTimer = memo(({ data, initial, label, isAnalysisMode }: { data: SyncPayload|null, initial: number, label: "White"|"Black", isAnalysisMode: boolean }) => {
	const { whiteTimeFormatted, blackTimeFormatted } = useChessClock(data, initial); 
		
	const isWhite = label === "White";
	const time = isWhite ? whiteTimeFormatted : blackTimeFormatted;

	const renderTime = () => {
		if (!isAnalysisMode) return time;

		const parts = time.split(':');
		const elements: React.ReactNode[] = [];

		parts.forEach((part, index) => {
			elements.push(<span key={`part-${index}`} className="leading-tight block text-center w-full">{part}</span>);

			if (index < parts.length - 1)
				elements.push(<span key={`sep-${index}`} className="leading-[0.5] block text-center w-full opacity-50">··</span>);
		});

		return elements;
	};

	const baseContainer = "flex transition-all duration-300 shadow-xl border-[#3c3a33] items-center";
	const colorStyles = isWhite ? "bg-[#f1f1f1]" : "bg-[#262421]";

	const orientationClasses = isAnalysisMode
		? `flex-col py-4 w-10 gap-4 ${isWhite ? "rounded-r-md border-r border-y" : "rounded-l-md border-l border-y"}`
		: `flex-row px-4 py-1.5 items-center gap-3 ${isWhite ? "rounded-b-md border-b border-x" : "rounded-t-md border-t border-x"}`;

	return (
		<div className={`${baseContainer} ${colorStyles} ${orientationClasses}`}>
			<span className={`text-[10px] font-bold tracking-tighter uppercase ${isAnalysisMode ? "flex flex-col items-center leading-none" : ""} ${isWhite ? "text-slate-400" : "text-slate-500"}`}>
				{isAnalysisMode ? label.split('').map((l, i) => <span key={i}>{l}</span>) : label}
			</span>

			<span className={`font-mono font-bold text-center ${isAnalysisMode ? "flex flex-col text-sm items-center gap-0.5" : "text-xl min-w-20"} ${isWhite ? "text-black" : "text-white"}`}>
				{renderTime()}
			</span>
		</div>
	);
});

export function ChessBoard({
	onInteraction, 
	setIsManualStarted,
	isManualStarted,
	isBroadcastActive,
	finalIsEnded,
	match, 
	currentMoveData, 
	isOnMove=false 
}: {
	onInteraction: () => void,
	setIsManualStarted: Dispatch<SetStateAction<boolean>>,
	isManualStarted: boolean
	isBroadcastActive: boolean
	finalIsEnded: boolean,
	match: Match,
	currentMoveData: Move,
	isOnMove?: boolean 
}) {
	const { selectedMoveIndex, isAnalysisMode } = useAnalysisState();
	const previewMove = isAnalysisMode ? undefined : (selectedMoveIndex ?? undefined);

	const containerRef = useRef<HTMLDivElement>(null);

	const totalMoves = currentMoveData?.history?.length || 0;
		
	useKeyboardNavigation(totalMoves);

	const activeFen = currentMoveData.fen;
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
			try {
				tempChess.move(move);
				return tempChess.fen();
			} catch (e) {
				return tempChess.fen();
			}
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
			<div className={`absolute z-10 transition-all duration-300 ${isAnalysisMode ? "top-0 -left-11" : "-top-12 left-0"}`}>
				<ChessTimer data={clockData} initial={initialTime} label="Black" isAnalysisMode={isAnalysisMode} />
			</div>
			<div className="relative w-full h-full overflow-hidden rounded-md border border-[#8b5e34]/20 shadow-lg">
			
				{!(isBroadcastActive || finalIsEnded || isManualStarted) && (
					<button 
						className='absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 p-3 z-10 border-4 rounded-lg bg-amber-900 border-amber-700 hover:bg-amber-800 hover:border-amber-600' 
						onClick={() => handleStart()}
					>
						<span className='text-gray-300 font-sans'>Start broadcast</span>
					</button>
				)}

				{finalIsEnded && (
					<div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 p-3 z-20 rounded-lg bg-amber-900 border-amber-700">
						<span className='text-gray-300 font-bold text-2xl font-sans'>Broadcast is over!</span>
					</div>
				)}

				<Chessground
					onSelect={isOnMove ? () => {} : onInteraction}
					onMove={isOnMove ? onInteraction : () => {}}
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
			<div className={`absolute z-10 transition-all duration-300 ${isAnalysisMode ? "bottom-0 -right-11" : "-bottom-12 right-0"}`}>
				<ChessTimer data={clockData} initial={initialTime} label="White" isAnalysisMode={isAnalysisMode} />
			</div>
		</div>
	);
}