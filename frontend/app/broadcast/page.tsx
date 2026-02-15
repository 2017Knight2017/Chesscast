'use client';

import { useState } from 'react';
import CreateMatchButton from '@/components/create_match_button';

export default function BroadcastPage() {
	const [pgnInput, setPgnInput] = useState('');

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

				<CreateMatchButton pgn={pgnInput} archetypes={["calculator", "intuitive"]} />
			</div>
		</div>
	);
}