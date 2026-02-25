'use client';

import Link from 'next/link';

export interface Broadcast {
	id: string;
	title: string;
	playerWhite: string;
	playerBlack: string;
	status: 'waiting' | 'in_progress' | 'finished';
	scheduledAt: string;
}

export const BroadcastCard = ({ broadcast }: { broadcast: Broadcast }) => {
	const isLive = broadcast.status === 'in_progress';

	return (
		<div className="bg-[#f4ead5] border-2 border-[#5d4037] p-5 shadow-[4px_4px_0px_#3e2723] hover:-translate-y-1 hover:shadow-[6px_6px_0px_#3e2723] transition-all duration-200 flex flex-col justify-between">
			<div>
				{/* Статус-бар */}
				<div className="flex justify-between items-center border-b border-[#5d4037]/30 pb-2 mb-4">
					<span className={`text-xs font-bold uppercase tracking-widest ${isLive ? 'text-red-700 animate-pulse' : 'text-[#5d4037]'}`}>
						{isLive ? 'В ЭФИРЕ' : 'АНОНС'}
					</span>
					<span className="text-sm font-serif italic text-[#5d4037]/80">
						{broadcast.scheduledAt}
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