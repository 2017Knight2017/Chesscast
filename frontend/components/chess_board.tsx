'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useBroadcast } from '@/hooks/use_broadcast';
import Chessground from '@bezalel6/react-chessground';
import { Chess } from 'chess.js';
import { parseMove } from "@/utils/parse_move"


export default function ChessBoard({ id }: { id: string }) {
	const game = useMemo(() => new Chess(), []);
	const containerRef = useRef<HTMLDivElement>(null);
	
	const [fen, setFen] = useState<string>('start');
	const [isStarted, setIsStarted] = useState<boolean>(false)
	const [isLoading, setIsLoading] = useState<boolean>(true);
	const { currentMove, isEnded } = useBroadcast(id);

	useEffect(() => {
		if (!containerRef.current) return;

		const resizeObserver = new ResizeObserver(() => {
			window.dispatchEvent(new Event('resize'));
		});

		resizeObserver.observe(containerRef.current);

		return () => resizeObserver.disconnect();
	}, []);
	
	useEffect(() => {
		const fetchMatchState = async () => {
			try {
				const res = await fetch(process.env.NEXT_PUBLIC_SOCKET_URL + `/matches/${id}/state`);
				if (res.ok) {
					const data = await res.json();
					if (data.isStarted) {
						setIsStarted(true);
						
						data.history.forEach((moveStr: string) => {
							const parsed = parseMove(moveStr);
							if (parsed) 
								game.move(parsed);
						});
						setFen(game.fen());
					}
				}
			} catch (e) {
				console.error("Не удалось загрузить состояние матча", e);
			} finally {
				setIsLoading(false);
			}
		};

		fetchMatchState();
	}, [id, game]);

	useEffect(() => {
		if (currentMove) {
			const parsed = parseMove(currentMove.move);
			if (parsed) {
				try {
					game.move(parsed);
					setFen(game.fen());
					console.log(`Оценка позиции: ${currentMove.evaluation / 100}`);
				} catch (e) {
					console.error("Нелегальный ход из сокета:", currentMove.move);
				}
			}
		}
	}, [currentMove, game]);

	const handleStart = async () => {
		setIsStarted(true);
		await fetch(process.env.NEXT_PUBLIC_SOCKET_URL + `/matches/${id}/start`, { method: 'POST' });
	};

	if (isLoading) {
		return <div className="text-white text-xl">Загрузка трансляции...</div>;
	}
		
	return (
		<div ref={containerRef} className='w-full h-full flex justify-center items-center flex-col sepia-100 brightness-75 contrast-125'>
			{!isStarted && !isEnded &&
				<button className='absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 p-3 z-10 border-4 rounded-lg bg-amber-900 border-amber-700 hover:bg-amber-800 hover:border-amber-600 ' onClick={() => handleStart()}>
					<span className='text-gray-300 font-sans'>Начать трансляцию</span>
				</button>
			}
			<Chessground
				fen={fen}
				viewOnly={false}
				width={"100%"}
				height={"100%"}
				movable={{
					free: true,
					color: "both"
				}}
				animation={{
					enabled: true,
					duration: 500
				}}
			/>
			{isEnded && (
				<div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 p-3 z-10 rounded-lg bg-amber-900 border-amber-700">
					<span className='text-gray-300 font-bold text-2xl font-sans'>Трансляция завершена!</span>
				</div>
			)}
		</div>
	);
}