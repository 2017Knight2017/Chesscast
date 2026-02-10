'use client';

import { useState } from 'react';
import ChessBroadcast from '@/components/chessboard';
import { createMatch } from '@/components/actions';
import StartMatchButton from '@/components/StartMatchButton';

function generateUUID(): string {
	if (typeof globalThis.crypto?.randomUUID === 'function') {
		return globalThis.crypto.randomUUID();
	}

	const rnd = new Uint8Array(16);
	globalThis.crypto?.getRandomValues(rnd);

	// Per RFC4122 v4
	rnd[6] = (rnd[6] & 0x0f) | 0x40;
	rnd[8] = (rnd[8] & 0x3f) | 0x80;

	const hex = Array.from(rnd).map((b) => b.toString(16).padStart(2, '0')).join('');

	return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export default function BroadcastPage() {
	const [pgnInput, setPgnInput] = useState('');
	const [activePgn, setActivePgn] = useState('');
	const handleStart = () => {
		setActivePgn(pgnInput);
	};

	return (
		<div className="flex flex-col items-center p-8 bg-slate-900 min-h-screen text-white">
			<h1 className="text-2xl font-bold mb-6">Панель управления трансляцией</h1>
			
			<div className="w-full max-w-2xl mb-10 space-y-4">
				<textarea
					className="w-full h-32 p-4 rounded bg-slate-800 border border-slate-700 focus:border-blue-500 outline-none transition-all"
					placeholder="Вставьте ваш PGN сюда..."
					value={pgnInput}
					onChange={(e) => setPgnInput(e.target.value)}
				/>

				<StartMatchButton matchId={generateUUID()} />
			</div>

			{activePgn && (
				<div className="bg-white p-4 rounded shadow-2xl">
					{/* Мы передаем PGN в компонент доски только после нажатия кнопки */}
					<ChessBroadcast pgn={activePgn} intervalMs={1500} />
				</div>
			)}
		</div>
	);
}