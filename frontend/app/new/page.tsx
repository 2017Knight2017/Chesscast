"use client";

import { useEffect, useState } from "react";
import CreateMatchButton from "@/app/new/match_button";
import { PlayerInput } from "@/app/new/player_input";
import { ArchetypeDropdown } from "@/app/new/archetype_dropdown";

export default function BroadcastPage() {
	console.log("[new/page.tsx:BroadcastPage]");

	const [activeTab, setActiveTab] = useState<1 | 2 | 3>(1);

	const [pgnInput, setPgnInput] = useState("");
	const [title, setTitle] = useState("");
	const [timeControl, setTimeControl] = useState("1:30");
	const [timeIncrement, setTimeIncrement] = useState(5);

	const [isControlMove, setIsControlMove] = useState(false);
	const [controlMove, setControlMove] = useState(40);
	const [isRepeatableControlMove, setIsRepeatableControlMove] = useState(false);
	const [bonusTimeMin, setBonusTimeMin] = useState(30);
	const [nextControlMoveAfter, setNextControlMoveAfter] = useState(15);
	const [newTimeIncrement, setNewTimeIncrement] = useState(30);

	const isDisabled = !isControlMove;
	const inputClasses =
		"w-full p-3 rounded-sm bg-white border border-amber-600/50 focus:border-amber-800 text-stone-800 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed placeholder:text-stone-400 shadow-sm";
	const labelClasses = `block ${isDisabled ? "opacity-40" : "opacity-100"} transition-opacity`;
	const titleLabelClasses =
		"text-xs font-mono font-bold uppercase tracking-wider text-stone-900 mb-2 block";
	const buttonClasses = 
		"px-8 py-3 bg-oak-light hover:bg-oak text-stone-900 text-sm font-bold tracking-widest uppercase rounded transition-colors border border-oak-dark/50 ring-1 ring-inset ring-white/20 shadow-sm"

	const [whitePlayer, setWhitePlayer] = useState("");
	const [blackPlayer, setBlackPlayer] = useState("");
	const [whitePlayerQuery, setWhitePlayerQuery] = useState("");
	const [blackPlayerQuery, setBlackPlayerQuery] = useState("");

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

	const dbKeyToLabel: Record<string, string> = {
		"calculator": "Calculator",
		"intuitive": "Intuitive Genius",
		"attacker": "Chaos Attacker",
		"pragmatic": "Solid Pragmatist",
		"time_trouble": "Time Trouble Addict",
		"fortress": "Iron Fortress",
		"gambler": "Blunder Prone Gambler",
		"perfectionist": "Perfectionist",
		"berserker": "Tactical Berserker",
		"speed_demon": "Speed Demon",
		"grinder": "Psychological Grinder",
	};

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
		<div className="flex flex-col items-center p-4 md:p-8 pt-12 mt-20 bg-stone-950 text-white">
			<div className="w-full max-w-3xl flex justify-center items-center mb-8">
				<div className="text-xl font-bold flex items-center gap-2">
					<span>New Broadcast</span>
				</div>
			</div>
			<main className="bg-orange-50/10 backdrop-blur-sm p-4 size-full max-w-3xl border border-oak-dark/20 shadow-lg">
				<div className="bg-orange-50 border-l-4 border-oak-dark shadow-xl">
					<div className="flex border-b border-oak bg-amber-50/50">
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
											? "text-oak border-oak-dark bg-white"
											: "text-stone-400 border-transparent hover:text-stone-600 hover:bg-amber-50/50"
									}`}
								onClick={() => setActiveTab(tab.id as 1 | 2 | 3)}
							>
								{tab.label}
							</button>
						))}
					</div>
					
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
									<span className="text-base font-bold uppercase tracking-widest text-stone-700">
										Time Control
									</span>
									<div className="grid gap-6 grid-cols-2 mt-2">
										<label className="block">
											<span className={titleLabelClasses}>
												Base Time (H:MM)
											</span>
											<input
												type="text"
												placeholder="1:30"
												className={inputClasses}
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
										className={buttonClasses}
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
										query={whitePlayerQuery}
										onQueryChange={setWhitePlayerQuery}
										onSelect={(player) => {
											setWhitePlayer(player.name);
											if (player.archetype) {
												const label = dbKeyToLabel[player.archetype] || player.archetype;
												setArchetype1(label);
											}
										}}
										titleLabelClasses={titleLabelClasses}
										inputClasses={inputClasses}
									/>
									<PlayerInput
										label="Black"
										query={blackPlayerQuery}
										onQueryChange={setBlackPlayerQuery}
										onSelect={(player) => {
											setBlackPlayer(player.name);
											if (player.archetype) {
												const label = dbKeyToLabel[player.archetype] || player.archetype;
												setArchetype2(label);
											}
										}}
										titleLabelClasses={titleLabelClasses}
										inputClasses={inputClasses}
									/>
									<ArchetypeDropdown
										label="White Archetype"
										value={archetype1}
										onChange={setArchetype1}
										options={archetypeOptions}
										titleLabelClasses={titleLabelClasses}
										inputClasses={inputClasses}
									/>
									<ArchetypeDropdown
										label="Black Archetype"
										value={archetype2}
										onChange={setArchetype2}
										options={archetypeOptions}
										titleLabelClasses={titleLabelClasses}
										inputClasses={inputClasses}
									/>
								</div>
									
								<div className="flex justify-between pt-4 border-t border-white/5">
									<button
										onClick={() => setActiveTab(1)}
										className="px-6 py-3 text-stone-600 hover:text-stone-400 text-sm font-bold tracking-widest uppercase transition-colors"
									>
										Back
									</button>
									<button
										onClick={() => setActiveTab(3)}
										className={buttonClasses}
									>
										Next: Rules
									</button>
								</div>
							</div>
						)}
	
						{/* --- TAB 3: RULES & PGN --- */}
						{activeTab === 3 && (
							<div className="space-y-8 animate-in fade-in duration-300">
								<div className="space-y-4 bg-amber-50/50 p-6 rounded border border-oak">
									<label className="flex items-center gap-3 cursor-pointer border-b border-oak pb-4 mb-4">
										<input
											type="checkbox"
											className="w-5 h-5 rounded border-amber-600 bg-white text-amber-600 focus:ring-amber-500 focus:ring-offset-white"
											checked={isControlMove}
											onChange={(e) =>
												setIsControlMove(e.target.checked)
											}
										/>
										<span className="text-sm font-bold uppercase tracking-widest text-stone-700">
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
											className={`flex items-start gap-3 h-full ${labelClasses}`}
										>
											<input
												type="checkbox"
												className="mt-1 rounded border-amber-300 bg-white text-amber-600 focus:ring-amber-500 focus:ring-offset-white disabled:opacity-50 disabled:cursor-not-allowed"
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
									
								<div className="flex justify-between items-center">
									<button
										onClick={() => setActiveTab(2)}
										className="px-6 py-3 text-stone-600 hover:text-stone-400 text-sm font-bold tracking-widest uppercase transition-colors"
									>
										Back
									</button>
									
									<CreateMatchButton
										buttonClasses={buttonClasses}
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
			</main>
		</div>
	);
}
