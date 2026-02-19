'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Chessground from '@bezalel6/react-chessground';
import { Chess, Move } from 'chess.js';


export default function ChessBoard() {
	// Инициализируем движок (используем useMemo, чтобы не создавать новый объект при каждом рендере)
	const game = useMemo(() => new Chess(), []);
	
	const [fen, setFen] = useState<string>('start');
	const [moveIndex, setMoveIndex] = useState<number>(0);
	const [history, setHistory] = useState<Move[]>([]);

	return (
		<div className='w-full h-full flex justify-center items-center flex-col sepia-100 brightness-75 contrast-125'>
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
		</div>
	);
}