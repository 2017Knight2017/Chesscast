'use client'

import { useState, useEffect } from 'react';
import { Match } from '@/types/types';
import Link from 'next/link';

interface ParaboardListProps {
	id: string;
	setIsSpectatorTab?: (value: boolean) => void;
}

export function ParaboardList({ id, setIsSpectatorTab }: ParaboardListProps) {
	console.log("[watch/[id]/paraboard_list.tsx:ParaboardList]", { id });

	const [followedMatches, setFollowedMatches] = useState<Match[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const fetchFollowedMatches = async () => {
			const stored = localStorage.getItem('user');
			const user = stored ? JSON.parse(stored) : null;
			if (!user) {
				setIsLoading(false);
				return;
			}

			try {
				const token = user.token;
				const res = await fetch(`${process.env.NEXT_PUBLIC_SOCKET_URL}/matches/my_followed`, {
					headers: {
						'Authorization': `Bearer ${token}`,
					},
				});

				if (!res.ok) {
					throw new Error('Failed to fetch followed matches');
				}

				const data = await res.json();
				setFollowedMatches(data);
			} catch (err: unknown) {
				console.error('Error fetching followed matches:', err);
				setError(err instanceof Error ? err.message : 'Unknown error');
			} finally {
				setIsLoading(false);
			}
		};

		fetchFollowedMatches();
	}, []);

	const getStatusLabel = (status: Match['status']) => {
		switch (status) {
			case 'processing': return 'Обработка';
			case 'waiting': return 'Ожидание';
			case 'in_progress': return 'В эфире';
			case 'finished': return 'Завершено';
			default: return status;
		}
	};

	const getStatusColor = (status: Match['status']) => {
		switch (status) {
			case 'in_progress': return 'text-green-600';
			case 'finished': return 'text-gray-500';
			case 'waiting': return 'text-yellow-600';
			default: return 'text-slate-400';
		}
	};

	return (
		<div className="h-full flex flex-col p-4 border-l-4 border-amber-900 bg-orange-50 shadow-inner overflow-hidden">

			<div className="shrink-0 flex justify-between gap-2 border-b mb-2 pb-1 text-stone-900">
				<h3 className="font-mono">
					Paraboards List
				</h3>
				{setIsSpectatorTab &&
					<div className="ml-auto flex items-center gap-2">
						<button className="flex items-center justify-center" onClick={()=>setIsSpectatorTab(true)}>
							<svg width="24" height="24" viewBox="0 0 24 24" fill="#9f8e6e" className="block">
								<circle cx="12" cy="7" r="4" />
								<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
							</svg>
						</button>

						<div className="border-l border-amber-900/30 h-6 pr-1"></div>

						<button className="flex items-center justify-center">
							<svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true" className="block">
								<rect width="24" height="24" fill="#ffffd5"/>
								<rect x="0" y="0" width="12" height="12" fill="#9f8e6e"/>
								<rect x="12" y="12" width="12" height="12" fill="#9f8e6e"/>
							</svg>
						</button>
					</div>
				}
			</div>

			<div className="flex-1 overflow-y-auto space-y-2">
				{isLoading && (
					<div className="text-center text-stone-500 py-4">Загрузка...</div>
				)}

				{error && (
					<div className="text-center text-red-500 py-4 text-sm">{error}</div>
				)}

				{!isLoading && !error && followedMatches.length === 0 && (
					<div className="text-center text-stone-500 py-4 text-sm">
						Вы ещё не подписаны ни на один матч
					</div>
				)}

				{followedMatches.map((match) => (
					<Link
						key={match.id}
						href={`/watch/${match.id}`}
						className="block p-3 bg-white/50 hover:bg-white/80 rounded border border-amber-900/20 transition-colors"
					>
						<div className="flex justify-between items-start mb-2">
							<div className="flex-1 min-w-0">
								<div className="font-medium text-sm text-stone-800 truncate">
									{match.title}
								</div>
								<div className="text-xs text-stone-600 mt-1">
									<span className="text-white font-medium">{match.white?.name}</span>
									<span className="mx-1 text-stone-400">vs</span>
									<span className="text-black font-medium">{match.black?.name}</span>
								</div>
							</div>
							<span className={`text-xs font-medium ${getStatusColor(match.status)}`}>
								{getStatusLabel(match.status)}
							</span>
						</div>
					</Link>
				))}
			</div>

		</div>
	);
}
