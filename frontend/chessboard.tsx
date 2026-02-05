'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Chessground from '@bezalel6/react-chessground';
import { Chess, Move } from 'chess.js';
import '@bezalel6/react-chessground/dist/styles/chessground.css';

interface BroadcastProps {
  pgn: string;
  intervalMs?: number;
}

export default function ChessBroadcast({ pgn, intervalMs = 2000 }: BroadcastProps) {
  // Инициализируем движок (используем useMemo, чтобы не создавать новый объект при каждом рендере)
  const game = useMemo(() => new Chess(), []);
  
  const [fen, setFen] = useState<string>('start');
  const [moveIndex, setMoveIndex] = useState<number>(0);
  const [history, setHistory] = useState<Move[]>([]);

  useEffect(() => {
    try {
      game.loadPgn(pgn);
      setHistory(game.history({ verbose: true })); // Получаем подробную историю ходов
      game.reset(); // Сбрасываем в начало для старта трансляции
      setFen(game.fen());
    } catch (e) {
      console.error("Ошибка парсинга PGN:", e);
    }
  }, [pgn, game]);

  useEffect(() => {
    if (history.length === 0 || moveIndex >= history.length) return;

    const interval = setInterval(() => {
      const move = history[moveIndex];
      game.move(move);
      setFen(game.fen());
      setMoveIndex((prev) => prev + 1);
    }, intervalMs);

    return () => clearInterval(interval);
  }, [history, moveIndex, game, intervalMs]);

  return (
    <div style={{ width: '400px', height: '400px' }}>
      <Chessground
        fen={fen}
        viewOnly={true}
        width={400}
        height={400}
        // Все остальные настройки из Chessground Config передаются так же напрямую
        movable={{
          free: false,
          color: undefined
        }}
        animation={{
          enabled: true,
          duration: 500
        }}
      />
      <div className="mt-4 text-center font-mono">
        Ход: {moveIndex} / {history.length}
      </div>
    </div>
  );
}