"use client";

import { useEffect, useState } from "react";
import CreateMatchButton from "@/app/new/match_button";
import { PlayerInput } from "@/app/new/player_input";
import { ArchetypeDropdown } from "@/app/new/archetype_dropdown";

export default function BroadcastPage() {
	console.log("[new/page.tsx:BroadcastPage]");

	// State for Tabs
	const [activeTab, setActiveTab] = useState<1 | 2 | 3>(1);

	const [pgnInput, setPgnInput] = useState("");
	const [title, setTitle] = useState("");
	const [timeControl, setTimeControl] = useState("1:00");
	const [timeIncrement, setTimeIncrement] = useState(5);

	const [isControlMove, setIsControlMove] = useState(false);
	const [controlMove, setControlMove] = useState(25);
	const [isRepeatableControlMove, setIsRepeatableControlMove] =
		useState(false);
	const [bonusTimeMin, setBonusTimeMin] = useState(30);
	const [nextControlMoveAfter, setNextControlMoveAfter] = useState(16);
	const [newTimeIncrement, setNewTimeIncrement] = useState(30);

	const isDisabled = !isControlMove;
	const inputClasses =
		"w-full p-3 rounded-sm bg-stone-900 border border-amber-900/30 focus:border-white-500 text-stone-100 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed placeholder:text-stone-600";
	const labelClasses = `block ${isDisabled ? "opacity-40" : "opacity-100"} transition-opacity`;
	const titleLabelClasses =
		"text-xs font-bold uppercase tracking-wider text-white mb-2 block";

	const [whitePlayer, setWhitePlayer] = useState("");
	const [blackPlayer, setBlackPlayer] = useState("");

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
		["Desired archetype. Keep empty if unsure", ""],
		["Calculator", "Deep calculation in sharp positions (Alekhine style)"],
		["Intuitive Genius", "Fast, positional play (Capablanca style)"],
		["Chaos Attacker", "Thrives in tactical complications (Tal style)"],
		["Solid Pragmatist", "Balanced and safe"],
		["Time Trouble Addict", "Indecisive, burns time early"],
		["Iron Fortress", "Thinks longest when under pressure or facing captures"],
		["Blunder Prone Gambler", "Fast in chaos, slow in boredom"],
		["Perfectionist", "Struggles with equal choices"],
		["Tactical Berserker", "Freezes during captures and trades"],
		["Speed Demon", "Consistent high-speed play"],
		["Psychological Grinder", "Deep focus on sharp, double-edged positions"],
	];
	const [archetype1, setArchetype1] = useState(archetypeOptions[0][0]);
	const [archetype2, setArchetype2] = useState(archetypeOptions[0][0]);

	const getLocalDateTime = (date: Date = new Date()): string => {
		console.log("[new/page.tsx:getLocalDateTime]", { date });
		const offset = date.getTimezoneOffset() * 60000;
		const localISOTime = new Date(date.getTime() - offset)
			.toISOString()
			.slice(0, 16);
		return localISOTime;
	};

	return (
		<div className="flex flex-col items-center p-4 md:p-8 pt-12 mt-20 bg-stone-950 min-h-screen text-white">
			{/* Top Header */}
			<div className="w-full max-w-3xl flex justify-center items-center mb-8">
				<div className="text-xl font-bold flex items-center gap-2">
					<span>New Broadcast</span>
				</div>
			</div>

			{/* Main Card Container - Dark Paper Style */}
			<div className="w-full max-w-3xl bg-stone-900/50 rounded border-l-4 border-amber-900 shadow-2xl sepia-100">
				{/* Tabs Navigation */}
				<div className="flex border-b border-white/5 bg-black/20">
					{[
						{ id: 1, label: "1. Setup" },
						{ id: 2, label: "2. Players" },
						{ id: 3, label: "3. Rules & PGN" },
					].map((tab) => (
						<button
							key={tab.id}
							className={`flex-1 py-4 text-[10px] font-bold uppercase tracking-[0.2em] text-center border-b-2 transition-colors duration-200
								${
									activeTab === tab.id
										? "text-white-500 border-white/60 bg-stone-900/40"
										: "text-stone-500 border-transparent hover:text-stone-300 hover:bg-white/5"
								}`}
							onClick={() => setActiveTab(tab.id as 1 | 2 | 3)}
						>
							{tab.label}
						</button>
					))}
				</div>

				{/* Tab Content Area */}
				<div className="p-6 md:p-10">
					{/* --- TAB 1: SETUP --- */}
					{activeTab === 1 && (
						<div className="space-y-8 animate-in fade-in duration-300">
							<label className="block">
								<span className={titleLabelClasses}>
									Broadcast Title
								</span>
								<input
									type="text"
									className={inputClasses}
									placeholder="World Chess Championship 2026"
									value={title}
									onChange={(e) => setTitle(e.target.value)}
								/>
							</label>

							<label className="block">
								<span className={titleLabelClasses}>
									Start Date & Time (Local)
								</span>
								<input
									type="datetime-local"
									className={`${inputClasses} scheme-dark`}
									min={minDate}
									max={maxDate}
									value={scheduledAt}
									onChange={(e) =>
										setScheduledAt(e.target.value)
									}
								/>
							</label>

							<div>
								<span className={`${titleLabelClasses}`}>
									Time Control
								</span>
								<div className="grid gap-6 grid-cols-2">
									<label className="block">
										<span className={titleLabelClasses}>
											Base Time (H:MM)
										</span>
										<input
											type="text"
											placeholder="1:30"
											className={inputClasses}
											value={timeControl}
											onChange={(e) =>
												setTimeControl(e.target.value)
											}
										/>
									</label>
									<label className="block">
										<span className={titleLabelClasses}>
											Increment (SEC)
										</span>
										<input
											type="number"
											className={inputClasses}
											value={timeIncrement}
											onChange={(e) =>
												setTimeIncrement(
													parseInt(e.target.value) ||
														0,
												)
											}
										/>
									</label>
								</div>
							</div>

							<div className="flex justify-end pt-4">
								<button
									onClick={() => setActiveTab(2)}
									className="px-8 py-3 bg-white/50 hover:bg-white/40 text-stone-950 text-sm font-bold tracking-widest uppercase rounded-sm flex items-center gap-2 transition-colors shadow-lg shadow-amber-900/20"
								>
									Next: Players
								</button>
							</div>
						</div>
					)}

					{/* --- TAB 2: PLAYERS --- */}
					{activeTab === 2 && (
						<div className="space-y-8 animate-in fade-in duration-300">
							<div className="grid gap-8 grid-cols-2">
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
								<ArchetypeDropdown
									label="White Archetype"
									value={archetype1}
									onChange={setArchetype1}
									options={archetypeOptions}
								/>
								<ArchetypeDropdown
									label="Black Archetype"
									value={archetype2}
									onChange={setArchetype2}
									options={archetypeOptions}
								/>
							</div>

							<div className="flex justify-between pt-4 border-t border-white/5">
								<button
									onClick={() => setActiveTab(1)}
									className="px-6 py-3 text-stone-500 hover:text-stone-200 text-sm font-bold tracking-widest uppercase transition-colors"
								>
									Back
								</button>
								<button
									onClick={() => setActiveTab(3)}
									className="px-8 py-3 bg-white/50 hover:bg-white/40 text-stone-950 text-sm font-bold tracking-widest uppercase rounded-sm flex items-center gap-2 transition-colors shadow-lg shadow-amber-900/20"
								>
									Next: Rules
								</button>
							</div>
						</div>
					)}

					{/* --- TAB 3: RULES & PGN --- */}
					{activeTab === 3 && (
						<div className="space-y-8 animate-in fade-in duration-300">
							<div className="space-y-4 bg-black/20 p-6 rounded border border-white/5">
								<label className="flex items-center gap-3 cursor-pointer border-b border-white/5 pb-4 mb-4">
									<input
										type="checkbox"
										className="w-5 h-5 rounded border-stone-700 bg-stone-900 text-amber-600 focus:ring-white-500 focus:ring-offset-stone-900"
										checked={isControlMove}
										onChange={(e) =>
											setIsControlMove(e.target.checked)
										}
									/>
									<span className="text-sm font-bold uppercase tracking-widest text-white-500">
										Enable Control Moves
									</span>
								</label>

								<div
									className={`grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-4 transition-all duration-300 ${isDisabled ? "opacity-30 pointer-events-none" : ""}`}
								>
									<label className={labelClasses}>
										<span className={titleLabelClasses}>
											Move #
										</span>
										<input
											type="number"
											className={inputClasses}
											value={controlMove}
											onChange={(e) =>
												setControlMove(
													parseInt(e.target.value),
												)
											}
										/>
									</label>
									<label className={labelClasses}>
										<span className={titleLabelClasses}>
											Bonus (Min)
										</span>
										<input
											type="number"
											className={inputClasses}
											value={bonusTimeMin}
											onChange={(e) =>
												setBonusTimeMin(
													parseInt(e.target.value),
												)
											}
										/>
									</label>
									<label className={labelClasses}>
										<span className={titleLabelClasses}>
											New Inc (Sec)
										</span>
										<input
											type="number"
											className={inputClasses}
											value={newTimeIncrement}
											onChange={(e) =>
												setNewTimeIncrement(
													parseInt(e.target.value) ||
														0,
												)
											}
										/>
									</label>
									<div
										className={`flex items-start gap-3 h-full pt-1 ${labelClasses}`}
									>
										<input
											type="checkbox"
											className="mt-1 rounded border-slate-600 bg-slate-900 text-blue-500 focus:ring-blue-500 focus:ring-offset-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
											checked={isRepeatableControlMove}
											onChange={(e) =>
												setIsRepeatableControlMove(
													e.target.checked,
												)
											}
											disabled={isDisabled}
										/>

										{isRepeatableControlMove &&
										isControlMove ? (
											<div className="block flex-1">
												<span
													className={
														titleLabelClasses
													}
												>
													Next Control Move After
												</span>
												<input
													type="number"
													className={inputClasses}
													value={nextControlMoveAfter}
													min={10}
													max={30}
													onChange={(e) =>
														setNextControlMoveAfter(
															parseInt(
																e.target.value,
															) || 16,
														)
													}
													disabled={isDisabled}
												/>
											</div>
										) : (
											<span className={titleLabelClasses}>
												Repeatable Control Move
											</span>
										)}
									</div>
								</div>
							</div>
							<label className="block">
								<span className={titleLabelClasses}>
									Initial PGN
								</span>
								<textarea
									className={`${inputClasses} h-40 resize-y font-mono text-sm`}
									placeholder='[Event "FIDE World Cup 2023"]&#10;[Site "Baku AZE"]&#10;...'
									value={pgnInput}
									onChange={(e) =>
										setPgnInput(e.target.value)
									}
								/>
							</label>

							<div className="flex justify-between pt-4 border-t border-amber-900/10 items-center">
								<button
									onClick={() => setActiveTab(2)}
									className="px-6 py-3 text-stone-500 hover:text-amber-900 text-sm font-bold tracking-widest uppercase transition-colors"
								>
									Back
								</button>

								{/* Здесь предполагается, что компонент CreateMatchButton внутри себя также использует палитру amber/stone для кнопки Finish */}
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
									isRepeatableControlMove={
										isRepeatableControlMove
									}
									bonusTimeMin={bonusTimeMin}
									nextControlMoveAfter={nextControlMoveAfter}
									newTimeIncrement={newTimeIncrement}
									scheduledAt={
										scheduledAt
											? new Date(
													scheduledAt,
												).toISOString()
											: new Date().toISOString()
									}
								/>
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
