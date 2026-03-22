'use client';

import { createContext, useContext, useEffect, useRef, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';

const SocketContext = createContext<Socket | null>(null);

export function SocketProvider({ children }: { children: ReactNode }) {
	const socketRef = useRef<Socket | null>(null);

	if (!socketRef.current) {
		socketRef.current = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001', {
			transports: ['websocket'],
			autoConnect: true,
		});
	}

	useEffect(() => {
		const socket = socketRef.current;

		return () => {
			if (socket) {
				socket.disconnect();
			}
		};
	}, []);

	return (
		<SocketContext.Provider value={socketRef.current}>
			{children}
		</SocketContext.Provider>
	);
}

export function useSocket() {
	const socket = useContext(SocketContext);
	if (!socket) {
		throw new Error('useSocket must be used within a SocketProvider');
	}
	return socket;
}
