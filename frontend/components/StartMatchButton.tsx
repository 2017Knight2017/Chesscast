'use client'

import { useTransition } from 'react';
import { startMatchAction } from '@/app/actions/match_actions';

interface Props {
  matchId: string;
}

export default function StartMatchButton({ matchId }: Props) {
  // isPending = true, пока выполняется Server Action
  const [isPending, startTransition] = useTransition();

  const handleClick = () => {
    startTransition(async () => {
      const result = await startMatchAction(matchId);
      
      if (result.success) {
        alert('Успех: ' + result.message); // Или красивый Toast
      } else {
        alert('Ошибка: ' + result.message);
      }
    });
  };

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className={`px-4 py-2 rounded text-white font-bold transition-colors
        ${isPending 
          ? 'bg-gray-400 cursor-not-allowed' 
          : 'bg-green-600 hover:bg-green-700'
        }`}
    >
      {isPending ? 'Запуск...' : '▶ Запустить трансляцию'}
    </button>
  );
}