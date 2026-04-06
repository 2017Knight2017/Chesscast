'use client'

import { ViewerStatus } from "@/hooks/use_viewer_counts";
import { useState, useEffect, Dispatch, SetStateAction } from "react";
import Chessground from "@bezalel6/react-chessground";
import { getPlayerByUsernameAction, loadAnalysisAction } from "@/actions/analysis_actions";
import { Move, MoveTreeNode } from "@/types/types";

interface SpectatorListProps {
	id: string;
	onInspectUser?: (status: ViewerStatus) => void;
	setIsSpectatorTab?: Dispatch<SetStateAction<boolean>>;
	usernames: Record<string, ViewerStatus[]>;
	guestCount: Record<string, number>;
	currentMoveData?: Move | null;
}

export function SpectatorList({ id, onInspectUser, usernames, guestCount, currentMoveData, setIsSpectatorTab }: SpectatorListProps) {
	console.log("[watch/[id]/spectator_list.tsx:SpectatorList]", { id });
	const [selectedSpectator, setSelectedSpectator] = useState<string | null>(null);
	const [previewFen, setPreviewFen] = useState<string | null>(null);
	
	let resolvedUsernames: ViewerStatus[] = [];
	let resolvedGuestCount = 0;
	if (usernames) resolvedUsernames = usernames[id] || [];
	if (guestCount) resolvedGuestCount = guestCount[id] || 0;

	useEffect(() => {
		let isCurrent = true;
		const fetchUserFen = async () => {
			if (!selectedSpectator) {
				if (isCurrent) setPreviewFen(null);
				return;
			}

			const status = resolvedUsernames.find(u => u.username === selectedSpectator);
			if (status?.currentFen) {
				if (isCurrent) setPreviewFen(status.currentFen);
				return;
			}

			const playerResult = await getPlayerByUsernameAction(selectedSpectator);
			if (!playerResult.success || !playerResult.data) {
				if (isCurrent) setPreviewFen(null);
				return;
			}
			
			try {
				const analysisData = await loadAnalysisAction(id, playerResult.data.userId);
				if (!isCurrent) return;
				
				if (analysisData.data && Object.keys(analysisData.data).length > 0) {
					const { Chess } = await import('chess.js');
					const tree = analysisData.data as Record<number, MoveTreeNode[]>;
					
					const firstKey = Object.keys(tree)[0];
					const branchRootIndex = parseInt(firstKey);
					
					const chess = new Chess();
					
					if (currentMoveData && branchRootIndex < currentMoveData.history.length) {
						for (let i = 0; i <= branchRootIndex; i++) {
							try {
								chess.move(currentMoveData.history[i]);
							} catch (e) {
								console.error("Failed to apply history move in preview", currentMoveData.history[i]);
							}
						}
					} else if (currentMoveData) {
						chess.load(currentMoveData.fen);
					}
					
					let current = tree[branchRootIndex];
					
					while (current && current.length > 0) {
						const node = current[0];
						try {
							chess.move(node.m);
							current = node.s || [];
						} catch (e) {
							break;
						}
					}
					
					if (isCurrent) setPreviewFen(chess.fen());
				} else if (currentMoveData) {
					if (isCurrent) setPreviewFen(currentMoveData.fen);
				} else {
					if (isCurrent) setPreviewFen(null);
				}
			} catch (error) {
				console.error("Error fetching user FEN:", error);
				if (isCurrent && currentMoveData) setPreviewFen(currentMoveData.fen);
			}
		};

		fetchUserFen();
		return () => { isCurrent = false; };
	}, [selectedSpectator, id, resolvedUsernames, currentMoveData]);

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
		<div className="h-full flex flex-col p-4 border-l-4 border-amber-900 bg-orange-50 shadow-inner overflow-hidden">

			<div className="shrink-0 flex justify-between gap-2 border-b mb-2 pb-1 text-stone-900">
				<h3 className="font-mono">
					Spectator List
				</h3>
				{setIsSpectatorTab && 
					<div className="-mt-1 ml-auto flex items-center gap-2">
						<button className="flex items-center justify-center p-1 rounded hover:bg-amber-900/10 transition-colors disabled:opacity-50">
							<svg width="24" height="24" viewBox="0 0 24 24" fill="#9f8e6e" className="block">
								<circle cx="12" cy="7" r="4" />
								<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
							</svg>
						</button>

						<div className="border-l border-amber-900/30 h-6 pr-1"></div>

						<button className="flex items-center justify-center p-1 rounded hover:bg-amber-900/10 transition-colors disabled:opacity-50" onClick={()=>{setIsSpectatorTab(false)}}>
							<svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true" className="block">
								<rect width="24" height="24" fill="#ffffd5"/>
								<rect x="0" y="0" width="12" height="12" fill="#9f8e6e"/>
								<rect x="12" y="12" width="12" height="12" fill="#9f8e6e"/>
							</svg>
						</button>
					</div>
				}
			</div>
			<div className="shrink-0 flex flex-row overflow-x-auto overflow-y-hidden gap-3 pb-2 mb-2 font-serif">
				{resolvedUsernames.length > 0 ? (
					resolvedUsernames.map((status) => (
						<button
							key={status.username}
							onClick={() => handleSpectatorClick(status.username)}
							className={`shrink-0 whitespaces-nowrap flex items-center gap-1 transition-colors px-3 py-2 lg:px-2 lg:py-1 rounded border ${
								selectedSpectator === status.username 
									? "bg-amber-900/20 border-amber-900/40 text-stone-900" 
									: "bg-orange-200/40 border-amber-900/10 text-stone-700 hover:text-amber-900 hover:border-amber-900/40"
							}`}
						>
							<span className="opacity-40 text-xs">❧</span>
							<span className="border-b border-transparent group-hover:border-amber-900 py-1 lg:py-0.5 text-sm lg:text-sm">
								{status.username}
								{status.isAnalyzing && <span className="ml-1 text-amber-900 font-bold">*</span>}
							</span>
						</button>
					))
				) : (
					<span className="text-sm italic opacity-50 text-stone-700 px-2">No spectators yet...</span>
				)}
			</div>
			
			<div className="flex-1 min-h-0 overflow-y-auto">
				{selectedSpectator && (
					<div className="mt-2 p-3 bg-orange-100 border-2 border-double border-amber-900/40 flex flex-col items-center animate-in fade-in slide-in-from-top-2">
						<div className="flex justify-between w-full items-start mb-2">
							<h4 className="font-bold text-stone-900 text-sm truncate pr-2">
								Preview: {selectedSpectator}
							</h4>
						</div>
				
						{previewFen && (
							<div 
								className="w-full aspect-square max-w-[160px] mx-auto mb-3 border-2 border-amber-900/30 shrink-0 cursor-pointer hover:border-amber-900 transition-colors"
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
							className="w-full py-1.5 px-3 bg-amber-900 text-orange-50 text-xs font-bold uppercase tracking-wider rounded hover:bg-stone-900 transition-colors shadow-sm"
						>
							View Full Analysis
						</button>
					</div>
				)}
			</div>
			
			<div className="shrink-0 mt-3 pt-2 border-t border-amber-900/10 flex justify-between items-center text-xs text-stone-700">
				<div className="flex items-center gap-1">
					<svg width="24" height="24" viewBox="0 0 24 24" fill="#86775c" className="user-icon">
						<circle cx="12" cy="7" r="4" />
						<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
					</svg>
					<span className="opacity-60">Total: {resolvedUsernames.length}</span>
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
