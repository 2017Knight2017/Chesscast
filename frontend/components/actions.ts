'use server'

import redis from '@/components/redis';
import { Console } from 'console';
import { randomUUID } from 'crypto';

export async function createMatch(pgn: string) {
    const matchId = randomUUID();
    
    // Добавляем PGN в очередь для воркера (список Redis)
    await redis.lpush('chess_tasks_queue', JSON.stringify({
        id: matchId,
        pgn: pgn,
		status: "pending",
        createdAt: Date.now(),
		movesData: null
    }));

    return { success: true, matchId };
}