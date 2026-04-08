"use client";

import { createMatchAction } from "@/actions/match_actions";
import { CreateMatchData } from "@/types/types";
import { useTransition } from "react";

export default function CreateMatchButton({
	pgn,
	archetypes,
	whitePlayer,
	blackPlayer,
	title,
	timeControlStr,
	isControlMove,
	isRepeatableControlMove,
	controlMove,
	timeIncrement,
	bonusTimeMin,
	nextControlMoveAfter,
	newTimeIncrement,
	scheduledAt,
}: CreateMatchData) {
	console.log("[new/match_button.tsx:CreateMatchButton]", JSON.stringify({
		pgn,
		archetypes,
		whitePlayer,
		blackPlayer,
		title,
		timeControlStr,
		controlMove,
		timeIncrement,
		bonusTimeMin,
		nextControlMoveAfter,
		newTimeIncrement,
		scheduledAt,
	}));
	const [isPending, startTransition] = useTransition();

	const convertTimeControlToSeconds = (timeStr: string): number => {
		console.log("[new/match_button.tsx:convertTimeControlToSeconds]", {
			timeStr,
		});
		const [hours, minutes] = timeStr.split(":").map(Number);
		return hours * 3600 + minutes * 60;
	};

	const handleClick = () => {
		console.log("[new/match_button.tsx:handleClick]");
		let errorMessage = "";
		if (!pgn.trim()) errorMessage += "PGN не может быть пустым\n";
		if (!title.trim())
			errorMessage += "Название партии не может быть пустым\n";
		if (!whitePlayer.trim())
			errorMessage += "Имя игрока 1 не может быть пустым\n";
		if (!blackPlayer.trim())
			errorMessage += "Имя игрока 2 не может быть пустым\n";
		if (!/^([0-9]+:)?[0-5]?[0-9]$/.test(timeControlStr!))
			errorMessage += "Неверный формат временного контроля\n";
		const scheduledDate = new Date(scheduledAt);
		if (isNaN(scheduledDate.getTime()) || scheduledDate < new Date())
			errorMessage += "Неверная дата и время трансляции\n";
		if (errorMessage != "") {
			alert(errorMessage);
			return;
		}

		startTransition(async () => {
			const result = await createMatchAction({
				pgn: pgn,
				archetypes: archetypes,
				whitePlayer: whitePlayer,
				blackPlayer: blackPlayer,
				title: title,
				timeControlNum: convertTimeControlToSeconds(timeControlStr!),
				isControlMove: isControlMove,
				isRepeatableControlMove: isRepeatableControlMove,
				controlMove: controlMove,
				timeIncrement: timeIncrement,
				bonusTimeMin: bonusTimeMin,
				nextControlMoveAfter: nextControlMoveAfter,
				newTimeIncrement: newTimeIncrement,
				scheduledAt: scheduledAt,
			});

			if (result.success) {
				alert("Success: " + result.message);
			} else {
				alert("Error: " + result.message);
			}
		});
	};

	return (
		<button
			onClick={handleClick}
			disabled={isPending}
			className={`px-8 py-3 text-stone-800 text-sm font-bold tracking-widest uppercase rounded-sm flex items-center gap-2 transition-colors shadow-sm shadow-amber-300/40 border border-amber-300/50 ${isPending ? "bg-stone-200 cursor-not-allowed" : "bg-amber-100 hover:bg-amber-200"}`}
		>
			{isPending ? "Loading..." : "Create Broadcast"}
		</button>
	);
}
