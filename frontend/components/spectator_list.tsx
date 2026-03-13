'use client'

import { useViewerCounts } from "@/hooks/use_viewer_counts";
import { useState, useEffect } from "react";
import { useAnalysis } from "@/context/analysis_context";
import Chessground from "@bezalel6/react-chessground";

interface SpectatorListProps {
	id: string;
	onInspectUser?: (username: string) => void;
}

export function SpectatorList({ id, onInspectUser }: SpectatorListProps) {
	const [selectedSpectator, setSelectedSpectator] = useState<string | null>(null);
	const [previewFen, setPreviewFen] = useState<string | null>(null);
	const { usernames, guestCount } = useViewerCounts([id]);
	const { isAnalysisMode } = useAnalysis();
	let resolvedUsernames: string[] = [];
	let resolvedGuestCount = 0;
	if (usernames) resolvedUsernames = usernames[id] || [];
	if (guestCount) resolvedGuestCount = guestCount[id] || 0;

	useEffect(() => {
		if (!selectedSpectator || !isAnalysisMode) {
			setPreviewFen(null);
			return;
		}

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
	}, [selectedSpectator, id, isAnalysisMode]);

	const handleSpectatorClick = (username: string) => {
		setSelectedSpectator(username);
		onInspectUser?.(username);
	};

	return (
		<div className="w-full max-w-md p-6 bg-[#f2e6d0] border border-[#8b5e34]/30 shadow-inner font-serif">
			<h3 className="text-center text-[#3e2b1d] uppercase tracking-widest border-b border-[#8b5e34]/20 mb-4 pb-2 text-sm font-bold">Список зрителей</h3>
			<div className="grid h-75 [grid-template-columns: repeat(autofit, 50%)] gap-x-8">
				{resolvedUsernames.length > 0 && 
					(resolvedUsernames.map((username) => (
						<button
							key={username}
							onClick={() => handleSpectatorClick(username)}
							className="block w-full text-left mb-2 text-[#5a3e2b] hover:text-[#8b5e34] transition-colors group"
						>
							<span className="opacity-40 mr-1">❧</span>
							<span className="border-b border-transparent group-hover:border-[#8b5e34] py-0.5">
								{username}
							</span>
						</button>
					)
				))}

				{selectedSpectator && isAnalysisMode && (
					<div className="mt-6 p-4 bg-[#e8dac0] border-2 border-double border-[#8b5e34]/40 animate-in fade-in slide-in-from-bottom-2">
						<div className="flex justify-between items-start mb-2">
							<h4 className="font-bold text-[#3e2b1d]">Analysis by {selectedSpectator}</h4>
							<button 
								onClick={() => setSelectedSpectator(null)}
								className="text-xs uppercase opacity-50 hover:opacity-100"
							>
								[закрыть]
							</button>
						</div>
						
						{previewFen && (
							<div className="w-full aspect-square max-w-[200px] mx-auto mb-2 border-2 border-[#8b5e34]/30">
								<Chessground
									fen={previewFen}
									viewOnly={true}
									coordinates={false}
									width="100%"
									height="100%"
								/>
							</div>
						)}

						<p className="text-xs leading-relaxed italic opacity-80">
							{previewFen 
								? 'Click to view full analysis' 
								: 'No analysis data yet'}
						</p>
					</div>
				)}

				<div className="mt-4 pt-2 border-t border-[#8b5e34]/10 flex justify-between items-center text-xs text-[#5a3e2b] opacity-60">
				    <div className="flex items-center gap-1">
				        <span className="text-lg">👥</span>
				        <span>Total viewers: {resolvedUsernames.length}</span>
				    </div>
				    {resolvedGuestCount > 0 && (
				        <div className="italic">
				            + {resolvedGuestCount} guests
				        </div>
				    )}
				</div>
			</div>
		</div>
	);
}
