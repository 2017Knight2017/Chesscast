'use client'

import React from 'react';
import Link from 'next/link';

// Типы для наших трансляций
interface Broadcast {
    id: string;
    title: string;
    playerWhite: string;
    playerBlack: string;
    status: 'live' | 'scheduled';
    scheduledTime: string;
}

// Временные данные для демонстрации
const mockBroadcasts: Broadcast[] = [
    {
        id: '1',
        title: 'Битва за корону',
        playerWhite: 'Капабланка',
        playerBlack: 'Алехин',
        status: 'live',
        scheduledTime: 'Сейчас',
    },
    {
        id: '2',
        title: 'Товарищеская партия',
        playerWhite: 'Нимцович',
        playerBlack: 'Ласкер',
        status: 'scheduled',
        scheduledTime: 'Сегодня, 19:00',
    },
    {
        id: '3',
        title: 'Клубный турнир',
        playerWhite: 'Боголюбов',
        playerBlack: 'Тартаковер',
        status: 'scheduled',
        scheduledTime: 'Завтра, 18:30',
    }
];

// Компонент карточки трансляции (как газетная вырезка)
const BroadcastCard = ({ broadcast }: { broadcast: Broadcast }) => {
    const isLive = broadcast.status === 'live';

    return (
        <div className="bg-[#f4ead5] border-2 border-[#5d4037] p-5 shadow-[4px_4px_0px_#3e2723] hover:-translate-y-1 hover:shadow-[6px_6px_0px_#3e2723] transition-all duration-200 flex flex-col justify-between">
            <div>
                {/* Статус-бар */}
                <div className="flex justify-between items-center border-b border-[#5d4037]/30 pb-2 mb-4">
                    <span className={`text-xs font-bold uppercase tracking-widest ${isLive ? 'text-red-700 animate-pulse' : 'text-[#5d4037]'}`}>
                        {isLive ? 'В ЭФИРЕ' : 'АНОНС'}
                    </span>
                    <span className="text-sm font-serif italic text-[#5d4037]/80">
                        {broadcast.scheduledTime}
                    </span>
                </div>

                {/* Заголовок */}
                <h3 className="text-2xl font-serif font-bold text-[#2d1b0e] mb-4 leading-tight">
                    {broadcast.title}
                </h3>

                {/* Игроки */}
                <div className="flex justify-between items-center font-serif text-lg mb-6">
                    <div className="flex flex-col items-center">
                        <span className="text-xs uppercase tracking-widest opacity-60">White</span>
                        <span className="font-bold">{broadcast.playerWhite}</span>
                    </div>
                    <span className="text-2xl opacity-40 italic">vs</span>
                    <div className="flex flex-col items-center">
                        <span className="text-xs uppercase tracking-widest opacity-60">Black</span>
                        <span className="font-bold">{broadcast.playerBlack}</span>
                    </div>
                </div>
            </div>

            {/* Кнопка перехода */}
            <Link 
                href={`/watch/${broadcast.id}`} 
                className={`text-center py-2 border-t-2 border-b-2 font-serif uppercase tracking-widest text-sm transition-colors ${
                    isLive 
                    ? 'border-red-900 text-red-900 bg-red-900/10 hover:bg-red-900 hover:text-[#f4ead5]' 
                    : 'border-[#5d4037] text-[#5d4037] hover:bg-[#5d4037] hover:text-[#f4ead5]'
                }`}
            >
                {isLive ? 'Смотреть партию' : 'Детали анонса'}
            </Link>
        </div>
    );
};

// Главная страница профиля
export default function MemberProfilePage({ params }: { params: { username: string } }) {
    // В реальном приложении здесь будет fetch данных пользователя по params.username
    const decodedUsername = decodeURIComponent(params.username);
    
    const liveBroadcasts = mockBroadcasts.filter(b => b.status === 'live');
    const scheduledBroadcasts = mockBroadcasts.filter(b => b.status === 'scheduled');

    return (
        <main className="min-h-screen bg-vintage-paper bg-size-[100%_100%] py-12 px-6 lg:px-24">
            <div className="max-w-6xl mx-auto">
                
                {/* Газетный заголовок профиля */}
                <header className="text-center mb-16 border-b-4 border-double border-[#5d4037] pb-8">
                    <p className="text-sm uppercase tracking-widest font-serif text-[#5d4037] mb-2">
                        Официальная страница гроссмейстера
                    </p>
                    <h1 className="text-6xl md:text-8xl font-serif font-bold text-[#2d1b0e] capitalize tracking-tight">
                        {decodedUsername}
                    </h1>
                </header>

                {/* Секция: В эфире */}
                {liveBroadcasts.length > 0 && (
                    <section className="mb-16">
                        <h2 className="text-3xl font-serif font-bold text-[#2d1b0e] mb-6 flex items-center gap-4">
                            <span className="w-3 h-3 rounded-full bg-red-700 animate-ping"></span>
                            Идут прямо сейчас
                            <div className="grow h-px bg-[#5d4037]/30 ml-4"></div>
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {liveBroadcasts.map(broadcast => (
                                <BroadcastCard key={broadcast.id} broadcast={broadcast} />
                            ))}
                        </div>
                    </section>
                )}

                {/* Секция: Запланированные */}
                {scheduledBroadcasts.length > 0 && (
                    <section>
                        <h2 className="text-3xl font-serif font-bold text-[#2d1b0e] mb-6 flex items-center gap-4">
                            Запланированные партии
                            <div className="grow h-px bg-[#5d4037]/30 ml-4"></div>
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {scheduledBroadcasts.map(broadcast => (
                                <BroadcastCard key={broadcast.id} broadcast={broadcast} />
                            ))}
                        </div>
                    </section>
                )}

                {/* Состояние пустоты (если нет трансляций) */}
                {liveBroadcasts.length === 0 && scheduledBroadcasts.length === 0 && (
                    <div className="text-center py-20 border-2 border-dashed border-[#5d4037]/30">
                        <p className="text-2xl font-serif italic text-[#5d4037]/60">
                            В данный момент шахматный клуб закрыт. Партий не предвидится.
                        </p>
                    </div>
                )}
            </div>
        </main>
    );
}