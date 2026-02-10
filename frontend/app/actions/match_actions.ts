'use server'

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

// Тип ответа от NestJS
interface StartMatchResponse {
  success: boolean;
  message: string;
}

export async function startMatchAction(matchId: string) {
  const apiUrl = process.env.NEST_API_URL;
  
  try {
    // 1. Делаем запрос к NestJS
    // Обрати внимание: это запрос Server-to-Server
    const res = await fetch(`${apiUrl}/matches/${matchId}/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Если нужна авторизация, передаем токен
        // 'Authorization': `Bearer ${token}` 
      },
      cache: 'no-store' // Важно! Не кешируем ответ
    });

    if (!res.ok) {
      const errorData = await res.json();
      return { 
        success: false, 
        message: errorData.message || 'Ошибка при запуске матча' 
      };
    }

    const data: StartMatchResponse = await res.json();

    // 2. Обновляем кэш страницы, чтобы UI сразу показал статус "Running"
    revalidatePath(`/matches/${matchId}`);
    
    return { success: true, message: 'Трансляция запущена!' };

  } catch (error) {
    console.error('Ошибка связи с API:', error);
    return { success: false, message: 'Не удалось соединиться с сервером' };
  }
}