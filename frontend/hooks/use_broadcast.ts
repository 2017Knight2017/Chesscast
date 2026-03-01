'use client';

import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

interface moveData {
	move: string,
	evaluation: number,
	nextMoveDelay: number,
	moveIndex: number,
}

export const useBroadcast = (matchId: string) => {
	const [currentMove, setCurrentMove] = useState<moveData | null>(null);
	const [isEnded, setIsEnded] = useState<boolean>(false);
	const [history, setHistory] = useState<string[]>([]);

	useEffect(() => {
        const socket: Socket = io(process.env.NEXT_PUBLIC_SOCKET_URL, {
            transports: ['websocket', 'polling'],
        });

        socket.on('connect', () => {
            console.log('Сокет подключен, ID:', socket.id);
            socket.emit('joinMatch', { matchId });
        });

        socket.on('newMove', (data: moveData) => {
            console.log('Новый ход:', data);
			
			setCurrentMove(data)
            setHistory((prev) => [...prev, data.move]);
        });

        socket.on('analysisEnded', (data: { matchId: string }) => {
            console.log('Трансляция партии завершена', data);
            setIsEnded(true);
        });

        socket.on('connect_error', (err) => {
            console.error('Ошибка подключения сокета:', err.message);
        });

        return () => {
            socket.emit('leaveMatch', { matchId });
            
            socket.off('connect');
            socket.off('newMove');
            socket.off('analysisEnded');
            socket.off('connect_error');
            
            socket.disconnect();
        };
    }, [matchId]);

	return { currentMove, isEnded, history,  };
};