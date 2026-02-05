'use client';

import { useState } from 'react';
import ChessBroadcast from '@/components/chessboard';

export default function BroadcastPage() {
  const [pgnInput, setPgnInput] = useState('');
  const [activePgn, setActivePgn] = useState('');

  const handleStart = () => {
    setActivePgn(pgnInput);
  };

  return (
    <div className="flex flex-col items-center p-8 bg-slate-900 min-h-screen text-white">
      <h1 className="text-2xl font-bold mb-6">Панель управления трансляцией</h1>
      
      <div className="w-full max-w-2xl mb-10 space-y-4">
        <textarea
          className="w-full h-32 p-4 rounded bg-slate-800 border border-slate-700 focus:border-blue-500 outline-none transition-all"
          placeholder="Вставьте ваш PGN сюда..."
          value={pgnInput}
          onChange={(e) => setPgnInput(e.target.value)}
        />
        <button
          onClick={handleStart}
          className="w-full bg-blue-600 hover:bg-blue-700 py-3 rounded font-bold transition-colors"
        >
          Запустить трансляцию
        </button>
      </div>

      {activePgn && (
        <div className="bg-white p-4 rounded shadow-2xl">
          {/* Мы передаем PGN в компонент доски только после нажатия кнопки */}
          <ChessBroadcast pgn={activePgn} intervalMs={1500} />
        </div>
      )}
    </div>
  );
}