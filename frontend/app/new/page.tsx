'use client';

import { useEffect, useState } from 'react';
import CreateMatchButton from '@/app/new/match_button';
import { PlayerInput } from '@/app/new/player_input';

export default function BroadcastPage() {
	console.log("[new/page.tsx:BroadcastPage]");
	const [pgnInput, setPgnInput] = useState('');
	const [title, setTitle] = useState('');
	const [timeControl, setTimeControl] = useState('1:00');
	const [controlMove, setControlMove] = useState(0);
	const [timeIncrement, setTimeIncrement] = useState(5);

	const [isRepeatableControlMove, setIsRepeatableControlMove] = useState(false);
	const [bonusTimeMin, setBonusTimeMin] = useState(30);
	const [nextControlMoveAfter, setNextControlMoveAfter] = useState(16);
	const [newTimeIncrement, setNewTimeIncrement] = useState(30);

	const [whitePlayer, setWhitePlayer] = useState('Magnus Carlsen');
	const [blackPlayer, setBlackPlayer] = useState('Hikaru Nakamura');

	const [scheduledAt, setScheduledAt] = useState("");
	const [minDate, setMinDate] = useState("");
	const [maxDate, setMaxDate] = useState("");
	useEffect(() => {
		console.log("[new/page.tsx:useEffect]");
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
		console.log("[new/page.tsx:getLocalDateTime]", { date });
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

				<div className="grid gap-4 grid-cols-3">
					<label className="block">
						<span className="text-sm">Time Control (H:MM)</span>
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
					<label className="block">
						<span className="text-sm">Increment (sec)</span>
						<input
							type="number"
							className="w-full p-2 rounded bg-slate-800 border border-slate-700 focus:border-blue-500 outline-none"
							value={timeIncrement}
							min={0}
							max={60}
							onChange={(e) => setTimeIncrement(parseInt(e.target.value) || 0)}
						/>
					</label>
					<div className="col-start-3 row-span-2 p-2 rounded bg-slate-800 border border-slate-700 space-y-4">
						<label className="block">
							<span className="text-sm">Control Move</span>
							<input
								type="number"
								className="w-full p-2 rounded bg-slate-900 border border-slate-700 focus:border-blue-500 outline-none"
								value={controlMove}
								min={0}
								max={60}
								onChange={(e) => setControlMove(parseInt(e.target.value) || 0)}
							/>
						</label>
						<label className="flex items-center gap-3 cursor-pointer">
							<input
								type="checkbox"
								className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-blue-500 focus:ring-blue-500 focus:ring-offset-slate-800"
								checked={isRepeatableControlMove}
								onChange={(e) => setIsRepeatableControlMove(e.target.checked)}
							/>
							{isRepeatableControlMove ? (
								<label className="block">
									<span className="text-sm font-medium">Next Control Move After</span>
									<input
										type="number"
										className="w-full p-2 rounded bg-slate-900 border border-slate-700 focus:border-blue-500 outline-none"
										value={nextControlMoveAfter}
										min={1}
										max={100}
										onChange={(e) => setNextControlMoveAfter(parseInt(e.target.value) || 16)}
									/>
								</label>
							) : (
								<span className="text-sm font-medium leading-16">Repeatable Control Move</span>
							)}
						</label>
					</div>
					<label className="block">
						<span className="text-sm">Bonus Time after Control (min)</span>
						<input
							type="number"
							className="w-full p-2 rounded bg-slate-800 border border-slate-700 focus:border-blue-500 outline-none"
							value={bonusTimeMin}
							min={1}
							max={120}
							onChange={(e) => setBonusTimeMin(parseInt(e.target.value) || 0)}
						/>
					</label>
					<label className="block">
						<span className="text-sm">Increment after Control (sec)</span>
						<input
							type="number"
							className="w-full p-2 rounded bg-slate-800 border border-slate-700 focus:border-blue-500 outline-none"
							value={newTimeIncrement}
							min={0}
							max={60}
							onChange={(e) => setNewTimeIncrement(parseInt(e.target.value) || 0)}
						/>
					</label>
					
				</div>

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
					controlMove={controlMove}
					timeIncrement={timeIncrement}
					isRepeatableControlMove={isRepeatableControlMove}
					bonusTimeMin={bonusTimeMin}
					nextControlMoveAfter={nextControlMoveAfter}
					newTimeIncrement={newTimeIncrement}
					scheduledAt={scheduledAt ? new Date(scheduledAt).toISOString() : new Date().toISOString()}
				/>
			</div>
		</div>
	);
}
