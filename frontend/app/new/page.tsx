'use client';

import { useState } from 'react';
import CreateMatchButton from '@/components/match_button';

export default function BroadcastPage() {
	const [pgnInput, setPgnInput] = useState('');
	const [title, setTitle] = useState('');
	const [scheduledAt, setScheduledAt] = useState(new Date().toISOString().slice(0, 16));
	
	const now = new Date();
	const maxDate = new Date();
	maxDate.setMonth(maxDate.getMonth() + 1);
	const maxDateString = maxDate.toISOString().slice(0, 16);
	
	const archetypeOptions = [
		'Calculator',
		'Intuitive',
		'Attacker',
		'Pragmatic',
		'Time Trouble',
	];
	const [archetype1, setArchetype1] = useState(archetypeOptions[0]);
	const [archetype2, setArchetype2] = useState(archetypeOptions[1]);

	return (
		<div className="flex flex-col items-center p-8 bg-slate-900 min-h-screen text-white">
			<h1 className="text-2xl font-bold mb-6">Панель управления трансляцией</h1>
			
			<div className="w-full max-w-2xl mb-10 space-y-4">
			<label className="block">
				<span className="text-sm">Заголовок</span>
				<input
					type="text"
					className="w-full p-2 rounded bg-slate-800 border border-slate-700 focus:border-blue-500 outline-none"
					value={title}
					onChange={(e) => setTitle(e.target.value)}
				/>
			</label>

			<label className="block">
				<span className="text-sm">Дата и время</span>
				<input
					type="datetime-local"
					className="w-full p-2 rounded bg-slate-800 border border-slate-700 focus:border-blue-500 outline-none"
					min={now.toISOString().slice(0, 16)}
					max={maxDateString}
					value={scheduledAt}
					onChange={(e) => setScheduledAt(e.target.value)}
				/>
			</label>

			<label className="block">
				<span className="text-sm">Архетип 1</span>
				<select
					className="w-full p-2 rounded bg-slate-800 border border-slate-700 focus:border-blue-500 outline-none"
					value={archetype1}
					onChange={(e) => setArchetype1(e.target.value)}
				>
					{archetypeOptions.map(opt => (
						<option key={opt} value={opt}>{opt}</option>
					))}
				</select>
			</label>

			<label className="block">
				<span className="text-sm">Архетип 2</span>
				<select
					className="w-full p-2 rounded bg-slate-800 border border-slate-700 focus:border-blue-500 outline-none"
					value={archetype2}
					onChange={(e) => setArchetype2(e.target.value)}
				>
					{archetypeOptions.map(opt => (
						<option key={opt} value={opt}>{opt}</option>
					))}
				</select>
			</label>

			<textarea
				className="w-full h-32 p-4 rounded bg-slate-800 border border-slate-700 focus:border-blue-500 outline-none transition-all"
				placeholder="Вставьте ваш PGN сюда..."
				value={pgnInput}
				onChange={(e) => setPgnInput(e.target.value)}
			/>
			<CreateMatchButton
				pgn={pgnInput}
				archetypes={[archetype1, archetype2]}
				title={title}
				scheduledAt={new Date(scheduledAt).toISOString()}
			/>
			</div>
		</div>
	);
}