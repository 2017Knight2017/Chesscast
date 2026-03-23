'use client'

import { createMatchAction } from '@/actions/match_actions';
import { useTransition } from 'react';

interface matchData {
	pgn: string;
	archetypes: [string, string];
	whitePlayer: string;
	blackPlayer: string;
	title: string;
	timeControl: string;
	controlMove: number;
	timeIncrement: number;
	isRepeatableControlMove: boolean;
	bonusTimeMin: number;
	nextControlMoveAfter: number;
	newTimeIncrement: number;
	scheduledAt: string;
}

export default function CreateMatchButton({ 
	pgn, 
	archetypes, 
	whitePlayer, 
	blackPlayer, 
	title, 
	timeControl, 
	controlMove, 
	timeIncrement,
	isRepeatableControlMove,
	bonusTimeMin,
	nextControlMoveAfter,
	newTimeIncrement,
	scheduledAt 
}: matchData) {
	const [isPending, startTransition] = useTransition();
	let errorMessage: string = "";

	const convertTimeControlToSeconds = (timeStr: string): number => {
		const [hours, minutes] = timeStr.split(':').map(Number);
		return (hours * 3600) + (minutes * 60);
	};

	const handleClick = () => {
		if (!pgn.trim()) errorMessage += "PGN не может быть пустым\n";
		if (!title.trim()) errorMessage += "Название партии не может быть пустым\n";
		if (!whitePlayer.trim()) errorMessage += "Имя игрока 1 не может быть пустым\n";
		if (!blackPlayer.trim()) errorMessage += "Имя игрока 2 не может быть пустым\n";
		if (!/^([0-9]+:)?[0-5]?[0-9]$/.test(timeControl)) errorMessage += "Неверный формат временного контроля\n";
		const scheduledDate = new Date(scheduledAt);
		if (isNaN(scheduledDate.getTime()) || scheduledDate < new Date()) errorMessage += "Неверная дата и время трансляции\n";
		if (errorMessage != "") {
			alert(errorMessage);
			return;
		}

		startTransition(async () => {
			const result = await createMatchAction(
				pgn, 
				archetypes, 
				whitePlayer, 
				blackPlayer, 
				title, 
				convertTimeControlToSeconds(timeControl), 
				controlMove,
				timeIncrement,
				isRepeatableControlMove,
				bonusTimeMin,
				nextControlMoveAfter,
				newTimeIncrement,
				scheduledAt
			);
			
			if (result.success) {
				alert('Успех: ' + result.message); 
			} else {
				alert('Ошибка: ' + result.message);
			}
		});
	};

	return (
		<button onClick={handleClick} disabled={isPending} className={`px-4 py-2 rounded text-white font-bold transition-colors ${isPending ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'}`}>
			{isPending ? 'На обработке...' : 'Создать трансляцию'}
		</button>
	);
}