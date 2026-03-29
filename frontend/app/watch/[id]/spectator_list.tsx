'use client'

import { useViewerCounts, ViewerStatus } from "@/hooks/use_viewer_counts";
import { useState, useEffect } from "react";
import Chessground from "@bezalel6/react-chessground";
import { getPlayerByUsernameAction, loadAnalysisAction } from "@/actions/analysis_actions";

interface SpectatorListProps {
	id: string;
	onInspectUser?: (status: ViewerStatus) => void;
}

export function SpectatorList({ id, onInspectUser }: SpectatorListProps) {
	console.log("[watch/[id]/spectator_list.tsx:SpectatorList]", { id });
	const [selectedSpectator, setSelectedSpectator] = useState<string | null>(null);
	const [previewFen, setPreviewFen] = useState<string | null>(null);
	const { usernames, guestCount } = useViewerCounts([id]);
	let resolvedUsernames: ViewerStatus[] = [];
	let resolvedGuestCount = 0;
	if (usernames) resolvedUsernames = usernames[id] || [];
	if (guestCount) resolvedGuestCount = guestCount[id] || 0;

	useEffect(() => {
		const fetchUserFen = async () => {
			if (!selectedSpectator) {
				setPreviewFen(null);
				return;
			}

			const status = resolvedUsernames.find(u => u.username === selectedSpectator);
			if (status?.currentFen) {
				setPreviewFen(status.currentFen);
				return;
			}

			const playerResult = await getPlayerByUsernameAction(selectedSpectator);
			if (!playerResult.success || !playerResult.data) {
				setPreviewFen(null);
				return;
			}
			
			const analysisData = await loadAnalysisAction(id, playerResult.data.userId);
			
			if (analysisData.data && Object.keys(analysisData.data).length > 0) {
				const { Chess } = await import('chess.js');
				const chess = new Chess();
				
				const tree = analysisData.data;
				const firstKey = Object.keys(tree)[0];
				let current = tree[parseInt(firstKey)];
				
				while (current && current.length > 0) {
					const node = current[0];
					try {
						chess.move(node.m);
						current = node.s || [];
					} catch (e) {
						break;
					}
				}
				
				setPreviewFen(chess.fen());
			} else {
				setPreviewFen(null);
			}
		};

		fetchUserFen();
	}, [selectedSpectator, id, resolvedUsernames]);

	const handleSpectatorClick = (username: string) => {
		console.log("[spectator_list.tsx:handleSpectatorClick]", { username });
		setSelectedSpectator(prev => prev === username ? null : username);
	};

	const handleViewFullAnalysis = () => {
		console.log("[spectator_list.tsx:handleViewFullAnalysis]");
		if (selectedSpectator && onInspectUser) {
			const status = resolvedUsernames.find(u => u.username === selectedSpectator);
			if (status) {
				onInspectUser(status);
			}
		}
	};

	return (
		<div className="w-full h-full flex flex-col p-4 bg-[#f2e6d0] border border-[#8b5e34]/30 shadow-inner font-serif overflow-hidden">

			<h3 className="shrink-0 text-center text-[#3e2b1d] uppercase tracking-widest border-b border-[#8b5e34]/20 mb-3 pb-2 text-sm font-bold">
				Spectator List
			</h3>

			<div className="shrink-0 flex flex-row overflow-x-auto overflow-y-hidden gap-3 pb-2 mb-2 scrollbar-thin scrollbar-thumb-[#8b5e34]/30">
				{resolvedUsernames.length > 0 ? (
					resolvedUsernames.map((status) => (
						<button
							key={status.username}
							onClick={() => handleSpectatorClick(status.username)}
							className={`shrink-0 whitespace-nowrap flex items-center gap-1 transition-colors group px-2 py-1 rounded border ${
								selectedSpectator === status.username 
									? "bg-[#8b5e34]/20 border-[#8b5e34]/40 text-[#3e2b1d]" 
									: "bg-[#e8dac0]/40 border-[#8b5e34]/10 text-[#5a3e2b] hover:text-[#8b5e34] hover:border-[#8b5e34]/40"
							}`}
						>
							<span className="opacity-40 text-xs">❧</span>
							<span className="border-b border-transparent group-hover:border-[#8b5e34] py-0.5 text-sm">
								{status.username}
								{status.isAnalyzing && <span className="ml-1 text-[#8b5e34] font-bold">*</span>}
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
								Preview: {selectedSpectator}
							</h4>
						</div>

						{previewFen && (
							<div 
								className="w-full aspect-square max-w-[160px] mx-auto mb-3 border-2 border-[#8b5e34]/30 shrink-0 cursor-pointer hover:border-[#8b5e34] transition-colors"
								onClick={handleViewFullAnalysis}
								title="Click to view full analysis"
							>
								<Chessground
									fen={previewFen}
									viewOnly={true}
									coordinates={false}
									width="100%"
									height="100%"
								/>
							</div>
						)}

						<button
							onClick={handleViewFullAnalysis}
							className="w-full py-1.5 px-3 bg-[#8b5e34] text-[#f2e6d0] text-xs font-bold uppercase tracking-wider rounded hover:bg-[#3e2b1d] transition-colors shadow-sm"
						>
							View Full Analysis
						</button>
					</div>
				)}
			</div>

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
