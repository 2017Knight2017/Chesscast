'use client'

import { Broadcast, BroadcastCard } from '@/components/broadcast_card';

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

export default function MemberProfilePage({ params }: { params: { username: string } }) {
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