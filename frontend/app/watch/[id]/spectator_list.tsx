'use client'

import { useViewerCounts } from "@/hooks/use_viewer_counts";
import { useState, useEffect } from "react";
import Chessground from "@bezalel6/react-chessground";

interface SpectatorListProps {
	id: string;
	onInspectUser?: (username: string) => void;
}

export function SpectatorList({ id, onInspectUser }: SpectatorListProps) {
	const [selectedSpectator, setSelectedSpectator] = useState<string | null>(null);
	const [previewFen, setPreviewFen] = useState<string | null>(null);
	const { usernames, guestCount } = useViewerCounts([id]);
	let resolvedUsernames: string[] = [];
	let resolvedGuestCount = 0;
	if (usernames) resolvedUsernames = usernames[id] || [];
	if (guestCount) resolvedGuestCount = guestCount[id] || 0;

	useEffect(() => {
		const fetchUserFen = async () => {
			const user = localStorage.getItem('user');
			if (!user) return;
			const parsed = JSON.parse(user);
			
			const res = await fetch(`${process.env.NEST_API_URL}/user-analysis/${id}/${parsed.id}`);
			const data = await res.json();
			
			if (data.data && data.data.length > 0) {
				const { Chess } = await import('chess.js');
				const chess = new Chess();
				
				const applyMoves = (tree: any[], path: number[]) => {
					let current = tree;
					for (const idx of path) {
						if (current[idx]) {
							chess.move(current[idx].m);
							if (current[idx].s) {
								current = current[idx].s;
							}
						}
					}
				};
				
				applyMoves(data.data, []);
				setPreviewFen(chess.fen());
			}
		};

		fetchUserFen();
	}, [selectedSpectator, id]);

	const handleSpectatorClick = (username: string) => {
		setSelectedSpectator(username);
		onInspectUser?.(username);
	};

	return (
		<div className="w-full h-full flex flex-col p-4 bg-[#f2e6d0] border border-[#8b5e34]/30 shadow-inner font-serif overflow-hidden">

			<h3 className="shrink-0 text-center text-[#3e2b1d] uppercase tracking-widest border-b border-[#8b5e34]/20 mb-3 pb-2 text-sm font-bold">
				Spectator List
			</h3>

			<div className="shrink-0 flex flex-row overflow-x-auto overflow-y-hidden gap-3 pb-2 mb-2 scrollbar-thin scrollbar-thumb-[#8b5e34]/30">
				{resolvedUsernames.length > 0 ? (
					resolvedUsernames.map((username) => (
						<button
							key={username}
							onClick={() => selectedSpectator === null ? handleSpectatorClick(username) : setSelectedSpectator(null)}
							className="shrink-0 whitespace-nowrap flex items-center gap-1 text-[#5a3e2b] hover:text-[#8b5e34] transition-colors group px-2 py-1 bg-[#e8dac0]/40 rounded border border-[#8b5e34]/10 hover:border-[#8b5e34]/40"
						>
							<span className="opacity-40 text-xs">❧</span>
							<span className="border-b border-transparent group-hover:border-[#8b5e34] py-0.5 text-sm">
								{username}
							</span>
						</button>
					))
				) : (
					<span className="text-sm italic opacity-50 text-[#5a3e2b] px-2">No spectators yet...</span>
				)}
			</div>

			<div className="flex-1 min-h-0 overflow-y-auto">
				{selectedSpectator && (
					<div className="mt-2 p-3 bg-[#e8dac0] border-2 border-double border-[#8b5e34]/40 flex flex-col items-center animate-in fade-in slide-in-from-top-2">
						<div className="flex justify-between w-full items-start mb-2">
							<h4 className="font-bold text-[#3e2b1d] text-sm truncate pr-2">
								Analysis by {selectedSpectator}
							</h4>
						</div>

						{previewFen && (
							<div className="w-full aspect-square max-w-[160px] mx-auto mb-2 border-2 border-[#8b5e34]/30 shrink-0">
								<Chessground
									fen={previewFen}
									viewOnly={true}
									coordinates={false}
									width="100%"
									height="100%"
								/>
							</div>
						)}

						<p className="text-xs leading-relaxed italic opacity-80 text-center">
							{previewFen 
								? 'Click to view full analysis' 
								: 'No analysis data yet'}
						</p>
					</div>
				)}
			</div>

			{/* 3. Подвал (не сжимается, прибит к низу) */}
			<div className="shrink-0 mt-3 pt-2 border-t border-[#8b5e34]/10 flex justify-between items-center text-xs text-[#5a3e2b] opacity-60">
				<div className="flex items-center gap-1">
					<span className="text-base">👥</span>
					<span>Total: {resolvedUsernames.length}</span>
				</div>
				{resolvedGuestCount > 0 && (
					<div className="italic">
						+ {resolvedGuestCount} guests
					</div>
				)}
			</div>
		</div>
	);
}
