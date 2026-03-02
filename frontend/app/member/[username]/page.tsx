'use client'

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { use } from 'react';

// Типизация для трансляции
interface Broadcast {
    id: string;
    title: string;
    scheduledAt: string;
    status: 'in_progress' | 'waiting' | 'finished';
}

export default function DashboardPage({ params }: { params: Promise<{ username: string }> }) {
    const router = useRouter();
    const resolvedParams = use(params);
    const decodedUsername = decodeURIComponent(resolvedParams.username);
    
    const [planned, setPlanned] = useState<Broadcast[]>([]);
    const [followed, setFollowed] = useState<Broadcast[]>([]);
    
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchDashboardData = async () => {
            const token = localStorage.getItem('token');
            if (!token) {
                router.push('/login');
                return;
            }

            const apiUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';
            const headers = { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            };

            try {
                const [plannedRes, followedRes] = await Promise.all([
                    fetch(`${apiUrl}/matches/my_planned`, { headers }),
                    fetch(`${apiUrl}/matches/my_followed`, { headers })
                ]);

                if (!plannedRes.ok || !followedRes.ok) {
                    throw new Error('Не удалось загрузить данные трансляций');
                }

                const plannedData = await plannedRes.json();
                const followedData = await followedRes.json();

                setPlanned(plannedData);
                setFollowed(followedData);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };

        fetchDashboardData();
    }, [router]);

    // --- Фильтрация данных ---
    
    // 1. Мои подписки
    const followedLive = followed.filter(b => b.status === 'in_progress');
    const followedScheduled = followed.filter(b => b.status === 'waiting');

    // 2. Мои трансляции (созданные мной)
    const plannedLive = planned.filter(b => b.status === 'in_progress');
    const plannedScheduled = planned.filter(b => b.status === 'waiting');

    if (isLoading) {
        return <div className="p-8 text-center text-[#5d4037]">Загрузка кабинета...</div>;
    }

    if (error) {
        return <div className="p-8 text-center text-red-500">Ошибка: {error}</div>;
    }

    return (
        <div className="max-w-6xl mx-auto p-6 space-y-12">
            <h1 className="text-3xl font-serif font-bold text-[#5d4037] border-b-2 border-[#8d6e63] pb-4">
                Личный кабинет
            </h1>

            {/* РАЗДЕЛ 1: МОИ ПОДПИСКИ (Я - зритель) */}
            <section className="space-y-6">
                <h2 className="text-2xl font-semibold text-[#5d4037]">Мои подписки</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Идущие сейчас */}
                    <div className="bg-white/80 p-6 rounded-lg shadow-sm border border-[#eefe] border-opacity-50">
                        <h3 className="text-xl font-medium mb-4 flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse"></span>
                            В эфире
                        </h3>
                        <BroadcastList broadcasts={followedLive} emptyMessage="Нет подписок в эфире" />
                    </div>

                    {/* Ожидаются */}
                    <div className="bg-white/80 p-6 rounded-lg shadow-sm border border-[#eefe] border-opacity-50">
                        <h3 className="text-xl font-medium mb-4 text-gray-700">Ожидаются</h3>
                        <BroadcastList broadcasts={followedScheduled} emptyMessage="Нет запланированных подписок" />
                    </div>
                </div>
            </section>

            {/* РАЗДЕЛ 2: МОИ ТРАНСЛЯЦИИ (Я - автор) */}
            <section className="space-y-6">
                <h2 className="text-2xl font-semibold text-[#5d4037]">Мои трансляции</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Запущенные мной */}
                    <div className="bg-[#fcf8f5] p-6 rounded-lg shadow-sm border border-[#8d6e63]">
                        <h3 className="text-xl font-medium mb-4 flex items-center gap-2 text-[#5d4037]">
                            <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse"></span>
                            Мои активные эфиры
                        </h3>
                        <BroadcastList broadcasts={plannedLive} emptyMessage="Вы сейчас ничего не транслируете" isOwner={true} />
                    </div>

                    {/* Запланированные мной */}
                    <div className="bg-[#fcf8f5] p-6 rounded-lg shadow-sm border border-[#8d6e63]">
                        <h3 className="text-xl font-medium mb-4 text-[#5d4037]">Запланировано мной</h3>
                        <BroadcastList broadcasts={plannedScheduled} emptyMessage="У вас нет запланированных эфиров" isOwner={true} />
                    </div>
                </div>
            </section>
        </div>
    );
}

// Вспомогательный компонент для отрисовки списка (чтобы не дублировать код)
function BroadcastList({ 
    broadcasts, 
    emptyMessage, 
    isOwner = false 
}: { 
    broadcasts: Broadcast[], 
    emptyMessage: string,
    isOwner?: boolean
}) {
    if (broadcasts.length === 0) {
        return <p className="text-gray-500 italic">{emptyMessage}</p>;
    }

    return (
        <ul className="space-y-3">
            {broadcasts.map((b) => (
                <li key={b.id} className="p-4 bg-white border border-gray-200 rounded-md flex justify-between items-center hover:shadow-md transition-shadow">
                    <div>
                        <h4 className="font-medium text-gray-800">{b.title}</h4>
                        <p className="text-sm text-gray-500">
                            {new Date(b.scheduledAt).toLocaleString('ru-RU', {
                                day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit'
                            })}
                        </p>
                    </div>
                    {/* Если это своя трансляция — показываем кнопку управления, если чужая — кнопку перехода к просмотру */}
                    <button className={`px-4 py-2 text-sm rounded-md font-medium transition-colors ${
                        isOwner 
                            ? 'bg-[#5d4037] text-white hover:bg-[#8d6e63]' 
                            : 'border border-[#5d4037] text-[#5d4037] hover:bg-[#5d4037] hover:text-white'
                    }`}>
                        {isOwner ? 'Управление' : 'Смотреть'}
                    </button>
                </li>
            ))}
        </ul>
    );
}


//'use client'
//
//import { Broadcast, BroadcastCard } from '@/components/broadcast_card';
//import { use } from "react";
//
//export default function MemberProfilePage({ params }: { params: Promise<{ username: string }> }) {
//	const resolvedParams = use(params);
//	const decodedUsername = decodeURIComponent(resolvedParams.username);
//
//	try {
//		const res = await fetch(`${process.env.NEXT_PUBLIC_NEST_API_URL}/planned`, {
//			method: 'GET',
//		});
//		
//		if (!res.ok) {
//			throw new Error(`Failed to fetch broadcasts: ${res.status}`);
//		}
//
//		const broadcasts: Broadcast[] = await res.json();
//		const liveBroadcasts = broadcasts.filter(b => b.status === 'in_progress');
//		const scheduledBroadcasts = broadcasts.filter(b => b.status === 'waiting');
//
//	return (
//		<main className="min-h-screen bg-vintage-paper bg-size-[100%_100%] py-12 px-6 lg:px-24">
//			<div className="max-w-6xl mx-auto">
//				
//				{/* Газетный заголовок профиля */}
//				<header className="text-center mb-16 border-b-4 border-double border-[#5d4037] pb-8">
//					<p className="text-sm uppercase tracking-widest font-serif text-[#5d4037] mb-2">
//						Официальная страница гроссмейстера
//					</p>
//					<h1 className="text-6xl md:text-8xl font-serif font-bold text-[#2d1b0e] capitalize tracking-tight">
//						{decodedUsername}
//					</h1>
//				</header>
//
//				{/* Секция: В эфире */}
//				{liveBroadcasts.length > 0 && (
//					<section className="mb-16">
//						<h2 className="text-3xl font-serif font-bold text-[#2d1b0e] mb-6 flex items-center gap-4">
//							<span className="w-3 h-3 rounded-full bg-red-700 animate-ping"></span>
//							Идут прямо сейчас
//							<div className="grow h-px bg-[#5d4037]/30 ml-4"></div>
//						</h2>
//						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
//							{liveBroadcasts.map(broadcast => (
//								<BroadcastCard key={broadcast.id} broadcast={broadcast} />
//							))}
//						</div>
//					</section>
//				)}
//
//				{/* Секция: Запланированные */}
//				{scheduledBroadcasts.length > 0 && (
//					<section>
//						<h2 className="text-3xl font-serif font-bold text-[#2d1b0e] mb-6 flex items-center gap-4">
//							Запланированные партии
//							<div className="grow h-px bg-[#5d4037]/30 ml-4"></div>
//						</h2>
//						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
//							{scheduledBroadcasts.map(broadcast => (
//								<BroadcastCard key={broadcast.id} broadcast={broadcast} />
//							))}
//						</div>
//					</section>
//				)}
//
//				{/* Состояние пустоты (если нет трансляций) */}
//				{liveBroadcasts.length === 0 && scheduledBroadcasts.length === 0 && (
//					<div className="text-center py-20 border-2 border-dashed border-[#5d4037]/30">
//						<p className="text-2xl font-serif italic text-[#5d4037]/60">
//							В данный момент шахматный клуб закрыт. Партий не предвидится.
//						</p>
//					</div>
//				)}
//			</div>
//		</main>
//	);
//}