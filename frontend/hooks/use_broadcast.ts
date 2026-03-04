'use client';

import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { Move } from '@/types/types'
import { getTurnFromFen } from '@/utils/get_turn_from_fen';

export const useBroadcast = (matchId: string) => {
    const [currentMoveData, setcurrentMoveData] = useState<Move | null>(null);
    const [isEnded, setIsEnded] = useState<boolean>(false);
    
    // Используем ref, чтобы знать, прилетал ли уже ход от сокета
    const hasLiveMove = useRef(false);

    // 1. Fetch начального состояния
    useEffect(() => {
        const controller = new AbortController();
        hasLiveMove.current = false; // Сброс при смене матча

        (async () => {
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_SOCKET_URL}/matches/${matchId}/state`, {
                    signal: controller.signal,
                });
                
                if (!res.ok) return;
                
                const text = await res.text();
                if (!text) return; // Защита от "Unexpected end of JSON input"
                
                const data = JSON.parse(text);

                // ВАЖНО: Если сокет УЖЕ прислал новый ход, игнорируем старые данные из API
                if (data?.fen && !hasLiveMove.current) {
                    setcurrentMoveData({
                        fen: data.fen,
                        whiteTimeMs: data.white?.timeMs ?? 0,
                        blackTimeMs: data.black?.timeMs ?? 0,
                        turn: data.fen.split(' ')[1], // Упрощенно
                        move: '',
                        evaluation: 0,
                        nextMoveDelay: 0,
                        moveIndex: 0,
                        history: data.history || [],
                    } as Move);
                }
            } catch (err: any) {
                if (err.name !== 'AbortError') console.error('Failed to fetch match state', err);
            }
        })();

        return () => controller.abort();
    }, [matchId]);

useEffect(() => {
        const stored = localStorage.getItem('user');
        const username = stored ? JSON.parse(stored).username : undefined;

        const socket: Socket = io(process.env.NEXT_PUBLIC_SOCKET_URL, {
            transports: ['websocket'],
        });

        socket.on('connect', () => {
            console.log('Сокет подключен, ID:', socket.id);
            socket.emit('joinMatch', { matchId, username });
        });

        socket.on('newMove', (data: Move) => {
            console.log('Новый ход:', data);
			
			setcurrentMoveData(data)
        });

        socket.on('analysisEnded', (data: { matchId: string }) => {
            console.log('Трансляция партии завершена', data);
            setIsEnded(true);
        });

        socket.on('connect_error', (err) => {
            console.error('Ошибка подключения сокета:', err.message);
        });

        return () => {
            socket.emit('leaveMatch', { matchId, username });
            
            socket.off('connect');
            socket.off('newMove');
            socket.off('analysisEnded');
            socket.off('connect_error');
            
            socket.disconnect();
        };
    }, [matchId]);

	return { currentMoveData, isEnded };
};