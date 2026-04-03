'use client';

import { useEffect, useState } from 'react';
import CreateMatchButton from '@/app/new/match_button';
import { PlayerInput } from '@/app/new/player_input';

export default function BroadcastPage() {
	console.log("[new/page.tsx:BroadcastPage]");
	const [pgnInput, setPgnInput] = useState('');
	const [title, setTitle] = useState('');
	const [timeControl, setTimeControl] = useState('1:00');
	const [timeIncrement, setTimeIncrement] = useState(5);

	const [isControlMove, setIsControlMove] = useState(false);
	const [controlMove, setControlMove] = useState(25);
	const [isRepeatableControlMove, setIsRepeatableControlMove] = useState(false);
	const [bonusTimeMin, setBonusTimeMin] = useState(30);
	const [nextControlMoveAfter, setNextControlMoveAfter] = useState(16);
	const [newTimeIncrement, setNewTimeIncrement] = useState(30);

	const isDisabled = !isControlMove;
	const inputClasses = "w-full p-2 rounded bg-slate-900 border border-slate-700 focus:border-blue-500 outline-none transition-opacity disabled:opacity-50 disabled:cursor-not-allowed";
	const labelClasses = `block ${isDisabled ? 'opacity-60' : 'opacity-100'} transition-opacity`;

	const [whitePlayer, setWhitePlayer] = useState('');
	const [blackPlayer, setBlackPlayer] = useState('');

	const [isAdvanced, setIsAdvanced] = useState(false);

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
		<div className="flex flex-col items-center p-8 pt-22 bg-stone-950 min-h-screen text-white">
			<div className="w-full max-w-2xl flex justify-between items-center mb-6">
				<h1 className="text-2xl font-bold">Creating a broadcast</h1>
				<button 
					onClick={() => setIsAdvanced(!isAdvanced)}
					className="px-4 py-2 rounded bg-slate-800 border border-slate-700 hover:bg-slate-700 transition-colors text-sm font-medium"
				>
					{isAdvanced ? 'Switch to Basic' : 'Switch to Advanced'}
				</button>
			</div>

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

				<div className='grid gap-4 grid-cols-2'>
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
				</div>
				
				{isAdvanced && (
					<div className="p-4 bg-slate-950 text-slate-100 rounded-lg max-w-7xl mx-auto space-y-4">
			
			<div className="bg-slate-800 border border-slate-700 p-4 rounded-t-lg">
				<label className="flex items-center gap-3 cursor-pointer">
					<input
						type="checkbox"
						className="w-5 h-5 rounded border-slate-600 bg-slate-900 text-blue-500 focus:ring-blue-500 focus:ring-offset-slate-800"
						checked={isControlMove}
						onChange={(e) => setIsControlMove(e.target.checked)}
					/>
					<span className="text-base font-semibold text-blue-100">
						Enable Control Moves (e.g. + 30 minutes after 40th move)
					</span>
				</label>
			</div>

			<div className={`grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4 bg-slate-800 border border-slate-700 p-4 rounded-b-lg items-center transition-all duration-300 ${isDisabled ? 'border-slate-700/50' : ''}`}>
				
				<label className={labelClasses}>
					<span className="text-sm block mb-1">Control Move</span>
					<input
						type="number"
						className={inputClasses}
						value={controlMove}
						min={25}
						max={60}
						onChange={(e) => setControlMove(parseInt(e.target.value))}
						disabled={isDisabled} 
					/>
				</label>

				<label className={labelClasses}>
					<span className="text-sm block mb-1">Bonus Time after Control (min)</span>
					<input
						type="number"
						className={inputClasses}
						value={bonusTimeMin}
						min={1}
						max={120}
						onChange={(e) => setBonusTimeMin(parseInt(e.target.value))}
						disabled={isDisabled}
					/>
				</label>

				<label className={labelClasses}>
					<span className="text-sm block mb-1">Increment after Control (sec)</span>
					<input
						type="number"
						className={inputClasses}
						value={newTimeIncrement}
						min={0}
						max={60}
						onChange={(e) => setNewTimeIncrement(parseInt(e.target.value) || 0)}
						disabled={isDisabled}
					/>
				</label>

				<div className={`flex items-start gap-3 h-full pt-1 ${labelClasses}`}>
					<input
						type="checkbox"
						className="mt-1 rounded border-slate-600 bg-slate-900 text-blue-500 focus:ring-blue-500 focus:ring-offset-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
						checked={isRepeatableControlMove}
						onChange={(e) => setIsRepeatableControlMove(e.target.checked)}
						disabled={isDisabled} 
					/>
					
					{isRepeatableControlMove && isControlMove ? (
						<div className="block flex-1">
							<span className="text-sm font-medium block mb-1">Next Control Move After</span>
							<input
								type="number"
								className={inputClasses}
								value={nextControlMoveAfter}
								min={10}
								max={30}
								onChange={(e) => setNextControlMoveAfter(parseInt(e.target.value) || 16)}
								disabled={isDisabled} 
							/>
						</div>
					) : (
						<span className="text-sm font-medium pt-0.5">Repeatable Control Move</span>
					)}
				</div>
			</div>
		</div>
				)}

				<div className={`grid gap-4 grid-cols-2 ${isAdvanced ? 'grid-rows-2' : 'grid-rows-1'}`}>
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
					{isAdvanced && (
						<>
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
						</>
					)}
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
					timeControlStr={timeControl}
					isControlMove={isControlMove}
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
