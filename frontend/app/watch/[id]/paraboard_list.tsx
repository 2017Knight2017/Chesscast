'use client'

import { useState, useEffect } from 'react';
import { Match } from '@/types/types';
import Link from 'next/link';
import { LiveMatchesList } from '@/components/live_matches_list';
import { ChessPreview } from '@/components/chess_preview';

interface ParaboardListProps {
	id: string;
	setIsSpectatorTab?: (value: boolean) => void;
}

export function ParaboardList({ id, setIsSpectatorTab }: ParaboardListProps) {
	console.log("[watch/[id]/paraboard_list.tsx:ParaboardList]", { id });

	const [followedMatches, setFollowedMatches] = useState<Match[]>([]);

	useEffect(() => {
		const fetchFollowedMatches = async () => {
			const token = localStorage.getItem('token');
			if (!token) {
				return;
			}

			try {
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
			}
		};

		fetchFollowedMatches();
	}, [id]);

	return (
		<div className="h-full flex flex-col p-4 border-l-4 border-amber-900 bg-orange-50 shadow-inner overflow-hidden">

			<div className="shrink-0 flex justify-between gap-2 border-b mb-2 pb-1 text-stone-900">
				<h3 className="font-mono">
					Paraboards List
				</h3>
				{setIsSpectatorTab &&
					<div className="-mt-1 ml-auto flex items-center gap-2">
						<button className="flex items-center justify-center p-1 rounded hover:bg-amber-900/10 transition-colors disabled:opacity-50" onClick={()=>setIsSpectatorTab(true)}>
							<svg width="24" height="24" viewBox="0 0 24 24" fill="#9f8e6e" className="block">
								<circle cx="12" cy="7" r="4" />
								<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
							</svg>
						</button>

						<div className="border-l border-amber-900/30 h-6 pr-1"></div>

						<button className="flex items-center justify-center p-1 rounded hover:bg-amber-900/10 transition-colors disabled:opacity-50">
							<svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true" className="block">
								<rect width="24" height="24" fill="#ffffd5"/>
								<rect x="0" y="0" width="12" height="12" fill="#9f8e6e"/>
								<rect x="12" y="12" width="12" height="12" fill="#9f8e6e"/>
							</svg>
						</button>
					</div>
				}
			</div>

			<div className="grid grid-cols-3 lg:grid-cols-2 gap-2 overflow-y-auto">
				{followedMatches
					.filter(match => match.id !== id)
					.map(match => (
						<ChessPreview key={match.id} match={match} />
					))
				}
			</div>
		</div>
	);
}
