'use client'

import { useTransition } from 'react';
import { createMatchAction } from '@/actions/match_actions';

interface matchData {
	pgn: string;
	archetypes: [string, string];
}

export default function CreateMatchButton({ pgn, archetypes }: matchData) {
	const [isPending, startTransition] = useTransition();

	const handleClick = () => {
		startTransition(async () => {
			const result = await createMatchAction(pgn, archetypes);
			
			if (result.success) {
				alert('Успех: ' + result.message); 
			} else {
				alert('Ошибка: ' + result.message);
			}
		});
	};

	return (
		<button onClick={handleClick} disabled={isPending}	className={`px-4 py-2 rounded text-white font-bold transition-colors ${isPending ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'}`}>
			{isPending ? 'Запуск...' : '▶ Запустить трансляцию'}
		</button>
	);
}