'use client';

import { useEffect, useState } from 'react';
import CreateMatchButton from '@/components/match_button';
import { PlayerInput } from '@/components/player_input';

export default function BroadcastPage() {
	const [pgnInput, setPgnInput] = useState('');
	const [title, setTitle] = useState('');
	const [timeControl, setTimeControl] = useState('0:10');
	const [whitePlayer, setWhitePlayer] = useState('');
	const [blackPlayer, setBlackPlayer] = useState('');

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
		"Desired archetype. Keep empty if unsure",
		"Calculator",
		"Intuitive Genius",
		"Chaos Attacker",
		"Solid Pragmatist",
		"Time Trouble Addict",
		"Iron Fortress",
		"Blunder Prone Gambler",
		"Perfectionist",
		"Tactical Berserker",
		"Speed Demon",
		"Psychological Grinder",
	];
	const [archetype1, setArchetype1] = useState(archetypeOptions[0]);
	const [archetype2, setArchetype2] = useState(archetypeOptions[0]);

	const getLocalDateTime = (date: Date = new Date()): string => {
		const offset = date.getTimezoneOffset() * 60000;
		const localISOTime = new Date(date.getTime() - offset).toISOString().slice(0, 16);
		return localISOTime;
	};

	return (
		<div className="flex flex-col items-center p-8 bg-slate-900 min-h-screen text-white">
			<h1 className="text-2xl font-bold mb-6">Creating a broadcast</h1>
			
			<div className="w-full max-w-2xl mb-10 space-y-4">
				<label className="block">
					<span className="text-sm">Title</span>
					<input
						type="text"
						className="w-full p-2 rounded bg-slate-800 border border-slate-700 focus:border-blue-500 outline-none"
						value={title}
						required
						onChange={(e) => setTitle(e.target.value)}
					/>
				</label>

				<label className="block">
					<span className="text-sm">Date</span>
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
					<span className="text-sm">Time Control (H:MM, from 0:10 to 9:59)</span>
					<input
						type="text"
						placeholder="H:MM"
						className="w-full p-2 rounded bg-slate-800 border border-slate-700 focus:border-blue-500 outline-none"
						value={timeControl}
						onChange={(e) => {
							let value = e.target.value.replace(/\D/g, '');
							
							if (value.length > 3) {
								value = value.slice(0, 3);
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
					<PlayerInput
						label="White"
						onSelect={(player) => {
							setWhitePlayer(player.name);
							if (player.archetype) {
								setArchetype1(player.archetype);
							}
						}} 
					/>
					<PlayerInput
						label="Black"
						onSelect={(player) => {
							setBlackPlayer(player.name);
							if (player.archetype) {
								setArchetype2(player.archetype);
							}
						}} 
					/>
					<label className="block">
						<span className="text-sm">White Archetype</span>
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
						<span className="text-sm">Black Archetype</span>
						<select
							className="w-full p-2 rounded bg-slate-800 border border-slate-700 focus:border-blue-500 outline-none"
							value={archetype2}
							onChange={(e) => setArchetype2(e.target.value)}
						>
							{archetypeOptions.map(opt => (
								<option key={opt} value={opt} title="fff">{opt}</option>
							))}
						</select>
					</label>
				</div>		
				<textarea
					className="w-full h-32 p-4 rounded bg-slate-800 border border-slate-700 focus:border-blue-500 outline-none transition-all"
					placeholder="Paste the PGN"
					value={pgnInput}
					onChange={(e) => setPgnInput(e.target.value)}
				/>
				<CreateMatchButton
					pgn={pgnInput}
					archetypes={[archetype1, archetype2]}
					whitePlayer={whitePlayer}
					blackPlayer={blackPlayer}
					title={title}
					timeControl={timeControl}
					scheduledAt={scheduledAt ? new Date(scheduledAt).toISOString() : new Date().toISOString()}
				/>
			</div>
		</div>
	);
}