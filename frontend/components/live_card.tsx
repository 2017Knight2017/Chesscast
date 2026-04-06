'use client';

import { Match } from '@/types/types';
import { ChessPreview } from './chess_preview';
import { useProcessing } from '@/hooks/use_processing';
import Link from 'next/link';
import { useFollowMatch } from '@/hooks/use_follow_match';

export const LiveCard = ({ match, viewerCount }: { match: Match, viewerCount?: number }) => {
	console.log("[live_card.tsx:LiveCard]", { matchId: match.id, viewerCount });
	const { isProcessing } = useProcessing(match);

	const { isFollowing, isLoading, toggleFollow } = useFollowMatch(match.id);

	const handleFollowClick = (e: React.MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();
		toggleFollow();
	};
	
	const CardWrapper = isProcessing ? 'div' : Link;
	const wrapperProps = isProcessing ? {} : { href: `/watch/${match.id}` };

	return (
		<CardWrapper {...(wrapperProps as any)} className="block">
			<div className={`
				bg-[#161512] rounded-md overflow-hidden transition-all 
				${isProcessing ? 'opacity-80 cursor-not-allowed' : 'hover:bg-[#1e1c18] cursor-pointer'}
			`}>
				<div className="relative">
					<ChessPreview match={match} isEmbedded={true} />
					
					{isProcessing && (
						<div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/60 backdrop-blur-[1px] animate-in fade-in duration-300">
							<svg className="w-12 h-12 text-[#b58863] animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
								<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
								<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
							</svg>
							<span className="mt-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[#b58863]/80">
								Processing...
							</span>
						</div>
					)}
				</div>
				
				<div className="relative p-3">
					
					<h3 className={`text-[13px] font-bold truncate transition-colors ${
						isProcessing ? 'text-slate-500' : 'text-slate-200 group-hover:text-blue-400'
					}`}>
						{match.title}
						<button
							onClick={handleFollowClick}
							disabled={isLoading}
							className="absolute top-2 right-1 z-10 p-1 rounded hover:bg-white/10 transition-colors disabled:opacity-50"
							title={isFollowing ? "Unfollow match" : "Follow match"}
						>
							<svg width="16" height="16" viewBox="0 0 24 24" fill={isFollowing ? "#fbbf24" : "none"} stroke="#fbbf24" strokeWidth="2" className="block">
								<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
							</svg>
						</button>
					</h3>
					<div className="flex items-center justify-between mt-1">
						<span className="text-[11px] text-slate-500">@{match.author}</span>
						<div className="flex items-center gap-1 text-[11px] text-slate-500">
							 <span className={`w-2 h-2 rounded-full ${isProcessing ? 'bg-[#b58863]' : 'bg-slate-600'}`}></span>
							 {isProcessing ? 'WAIT' : (viewerCount || match.viewerCount)}
						</div>
					</div>
					
				</div>
			</div>
		</CardWrapper>
	);
};