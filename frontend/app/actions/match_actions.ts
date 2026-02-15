'use server'

interface StartMatchResponse {
  success: boolean;
  message: string;
}

export async function createMatchAction(pgn: string, archetypes: [string, string]) {
  const apiUrl = process.env.NEST_API_URL;
  
  try {
    const res = await fetch(`${apiUrl}/matches`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json', 
      },
	  body: JSON.stringify({ author: 'admin', pgn: pgn, archetypes: archetypes }),
      cache: 'no-store'
    });

    if (!res.ok) {
      const errorData = await res.json();
      return { 
        success: false, 
        message: errorData.message || 'Ошибка при запуске матча' 
      };
    }

    const data: StartMatchResponse = await res.json();
    
    return { success: true, message: 'Трансляция запущена!' };

  } catch (error) {
    console.error('Ошибка связи с API:', error);
    return { success: false, message: 'Не удалось соединиться с сервером' };
  }
}