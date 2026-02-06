'use server'

import redis from '@/components/redis';
import { randomUUID } from 'crypto';

export async function createMatch(pgn: string) {
    const matchId = randomUUID();
    
    // Добавляем PGN в очередь для воркера (список Redis)
    await redis.lpush('chess_tasks_queue', JSON.stringify({
        id: matchId,
        pgn: pgn,
        timestamp: Date.now()
    }));

    return { success: true, matchId };
}