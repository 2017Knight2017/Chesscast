'use server'

import { cookies } from 'next/headers';

interface StartMatchResponse {
	success: boolean;
	message: string;
}

export async function createMatchAction(pgn: string, archetypes: [string, string], whitePlayer: string, blackPlayer: string, title: string, timeControl: number, scheduledAt: string): Promise<StartMatchResponse> {
	const cookieStore = await cookies();
	const token = cookieStore.get('token')?.value;

	if (!token) {
		return { success: false, message: 'Требуется авторизация' };
	}

	try {
		const res = await fetch(`${process.env.NEST_API_URL}/matches/create`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${token}`,
			},
		body: JSON.stringify({ pgn: pgn, archetypes: archetypes, whitePlayer: whitePlayer, blackPlayer: blackPlayer, title: title, timeControl: timeControl, scheduledAt: scheduledAt}),
			cache: 'no-store'
		});

		if (!res.ok) {
			const errorData = await res.json();
			return { 
				success: false, 
				message: errorData.message || 'Ошибка при запуске матча' 
			};
		}

		return { success: true, message: 'Трансляция создана!' };

	} catch (error) {
		console.error('Ошибка связи с API:', error);
		return { success: false, message: 'Не удалось соединиться с сервером' };
	}
}