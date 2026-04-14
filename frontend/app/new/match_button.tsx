"use client";

import { createMatchAction } from "@/actions/match_actions";
import { CreateMatchData } from "@/types/types";
import { useTransition } from "react";

interface CreateMatchButtonProps extends CreateMatchData {
	buttonClasses: string;
}

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
	buttonClasses,
}: CreateMatchButtonProps) {
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
		if (!pgn.trim()) errorMessage += "PGN cannot be empty\n";
		if (!title.trim())
			errorMessage += "Broadcast title cannot be empty\n";
		if (!whitePlayer.trim())
			errorMessage += "White player name cannot be empty\n";
		if (!blackPlayer.trim())
			errorMessage += "Black player name cannot be empty\n";
		if (!/^([0-9]+:)?[0-5]?[0-9]$/.test(timeControlStr!))
			errorMessage += "Invalid time control format\n";
		const scheduledDate = new Date(scheduledAt);
		if (isNaN(scheduledDate.getTime()) || scheduledDate < new Date())
			errorMessage += "Invalid broadcast date and time\n";
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
			} else if (result.isLimitError) {
				alert("⚠️ " + result.message);
			} else {
				alert("Error: " + result.message);
			}
		});
	};

	return (
		<button
			onClick={handleClick}
			disabled={isPending}
			className={`${buttonClasses} ${isPending ? "bg-stone-200 cursor-not-allowed" : ""}`}
		>
			{isPending ? "Loading..." : "Create Broadcast"}
		</button>
	);
}
