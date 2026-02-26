'use client';

import { useEffect, useState } from 'react';
import CreateMatchButton from '@/components/match_button';

export default function BroadcastPage() {
	const [pgnInput, setPgnInput] = useState('');
	const [title, setTitle] = useState('');
	const [timeControl, setTimeControl] = useState('0:10');

	const [scheduledAt, setScheduledAt] = useState("");
    const [minDate, setMinDate] = useState("");
    const [maxDate, setMaxDate] = useState("");
	useEffect(() => {
		const now = new Date();
		setMinDate(getLocalDateTime(now));
		const maxDateRaw = new Date();
		maxDateRaw.setMonth(maxDateRaw.getMonth() + 1);
		setMaxDate(getLocalDateTime(maxDateRaw));
	}, []);
	
	const archetypeOptions = [
		'Calculator',
		'Intuitive',
		'Attacker',
		'Pragmatic',
		'Time Trouble',
	];

	const [playerName1, setPlayerName1] = useState('Игрок 1');
	const [archetype1, setArchetype1] = useState(archetypeOptions[0]);
	const [playerName2, setPlayerName2] = useState('Игрок 2');
	const [archetype2, setArchetype2] = useState(archetypeOptions[1]);

	const getLocalDateTime = (date: Date = new Date()): string => {
		const offset = date.getTimezoneOffset() * 60000;
		const localISOTime = new Date(date.getTime() - offset).toISOString().slice(0, 16);
		return localISOTime;
	};

	return (
		<div className="flex flex-col items-center p-8 bg-slate-900 min-h-screen text-white">
			<h1 className="text-2xl font-bold mb-6">Создание трансляции</h1>
			
			<div className="w-full max-w-2xl mb-10 space-y-4">
				<label className="block">
					<span className="text-sm">Заголовок</span>
					<input
						type="text"
						className="w-full p-2 rounded bg-slate-800 border border-slate-700 focus:border-blue-500 outline-none"
						value={title}
						required
						onChange={(e) => setTitle(e.target.value)}
					/>
				</label>

				<label className="block">
					<span className="text-sm">Дата и время</span>
					<input
						type="datetime-local"
						className="w-full p-2 rounded bg-slate-800 border border-slate-700 focus:border-blue-500 outline-none"
						min={minDate}
						max={maxDate}
						value={scheduledAt}
						onChange={(e) => {
							const newValue = e.target.value;
							if (newValue === '') {
								setScheduledAt(minDate);
							} else {
								setScheduledAt(newValue);
							}
						}}
					/>
				</label>

				<label className="block">
					<span className="text-sm">Временной контроль (Ч:ММ, от 0:10 до 9:59)</span>
					<input
						type="text"
						placeholder="Ч:ММ"
						className="w-full p-2 rounded bg-slate-800 border border-slate-700 focus:border-blue-500 outline-none"
						value={timeControl}
						onChange={(e) => {
							let value = e.target.value.replace(/\D/g, '');
							
							if (value.length > 4) {
								value = value.slice(0, 4);
							}
							
							if (value.length <= 2) {
								setTimeControl(value);
							} else {
								setTimeControl(value.slice(0, value.length - 2) + ':' + value.slice(-2));
							}
						}}
						maxLength={5}
					/>
				</label>

				<div className="grid gap-4 grid-cols-2 grid-rows-2">
					<label className='block'>
						<span className="text-sm">Игрок белыми</span>
						<input
							type="text"
							className="w-full p-2 rounded bg-slate-800 border border-slate-700 focus:border-blue-500 outline-none"
							value={playerName1}
							onChange={(e) => setPlayerName1(e.target.value)}
						/>
					</label>
					<label className='block'>
						<span className="text-sm">Игрок чёрными</span>
						<input
							type="text"
							className="w-full p-2 rounded bg-slate-800 border border-slate-700 focus:border-blue-500 outline-none"
							value={playerName2}
							onChange={(e) => setPlayerName2(e.target.value)}
						/>
					</label>
					<label className="block">
						<span className="text-sm">Архетип белых</span>
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
						<span className="text-sm">Архетип чёрных</span>
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
				</div>
				<textarea
					className="w-full h-32 p-4 rounded bg-slate-800 border border-slate-700 focus:border-blue-500 outline-none transition-all"
					placeholder="Вставьте ваш PGN сюда..."
					value={pgnInput}
					onChange={(e) => setPgnInput(e.target.value)}
				/>
				<CreateMatchButton
					pgn={pgnInput}
					archetypes={[archetype1.toLowerCase(), archetype2.toLowerCase()]}
					whitePlayer={playerName1}
					blackPlayer={playerName2}
					title={title}
					timeControl={timeControl}
					scheduledAt={scheduledAt ? new Date(scheduledAt).toISOString() : new Date().toISOString()}
				/>
			</div>
		</div>
	);
}