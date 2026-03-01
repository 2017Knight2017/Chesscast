'use client';

import { Match } from '@/types/types';
import { ChessPreview } from './chess_preview';

export const LiveCard = ({ match, viewerCount }: { match: Match, viewerCount?: number }) => {
	return (
		<div className="group bg-[#161512] rounded-md overflow-hidden transition-all hover:bg-[#1e1c18] cursor-pointer">
			{/* Секция с доской */}
			<ChessPreview match={match} />
			
			{/* Секция с описанием под доской */}
			<div className="p-3">
				<h3 className="text-[13px] font-bold text-slate-200 truncate group-hover:text-blue-400 transition-colors">
					{match.title}
				</h3>
				<div className="flex items-center justify-between mt-1">
					<span className="text-[11px] text-slate-500">@{match.author}</span>
					<div className="flex items-center gap-1 text-[11px] text-slate-500">
						 <span className="w-2 h-2 bg-slate-600 rounded-full"></span>
						 {viewerCount || match.viewerCount}
					</div>
				</div>
			</div>
		</div>
	);
};