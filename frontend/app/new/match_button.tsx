'use client'

import { createMatchAction } from '@/actions/match_actions';
import { CreateMatchData } from '@/types/types';
import { useTransition } from 'react';

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
	scheduledAt 
}: CreateMatchData) {
	console.log("[new/match_button.tsx:CreateMatchButton]", { pgn, archetypes, whitePlayer, blackPlayer, title, timeControlStr, controlMove, timeIncrement, bonusTimeMin, nextControlMoveAfter, newTimeIncrement, scheduledAt });
	const [isPending, startTransition] = useTransition();
	let errorMessage: string = "";

	const convertTimeControlToSeconds = (timeStr: string): number => {
		console.log("[new/match_button.tsx:convertTimeControlToSeconds]", { timeStr });
		const [hours, minutes] = timeStr.split(':').map(Number);
		return (hours * 3600) + (minutes * 60);
	};

	const handleClick = () => {
		console.log("[new/match_button.tsx:handleClick]");
		if (!pgn.trim()) errorMessage += "PGN не может быть пустым\n";
		if (!title.trim()) errorMessage += "Название партии не может быть пустым\n";
		if (!whitePlayer.trim()) errorMessage += "Имя игрока 1 не может быть пустым\n";
		if (!blackPlayer.trim()) errorMessage += "Имя игрока 2 не может быть пустым\n";
		if (!/^([0-9]+:)?[0-5]?[0-9]$/.test(timeControlStr!)) errorMessage += "Неверный формат временного контроля\n";
		const scheduledDate = new Date(scheduledAt);
		if (isNaN(scheduledDate.getTime()) || scheduledDate < new Date()) errorMessage += "Неверная дата и время трансляции\n";
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
				scheduledAt: scheduledAt
			})
			
			if (result.success) {
				alert('Success: ' + result.message); 
			} else {
				alert('Error: ' + result.message);
			}
		});
	};

	return (
		<button onClick={handleClick} disabled={isPending} className={`px-4 py-2 rounded text-white font-bold transition-colors ${isPending ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'}`}>
			{isPending ? 'Loading...' : 'Create Broadcast'}
		</button>
	);
}