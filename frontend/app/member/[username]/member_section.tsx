'use client'

import { LiveMatchesList } from "@/components/live_matches_list";
import { Match } from "@/types/types";

export function MemberSection({matches, styles}: {matches: Match[], styles: string}) { 
	console.log("[member/[username]/member_section.tsx:MemberSection]", { matches, styles });
	const live = matches.filter(b => b.status === 'in_progress');
	const planned = matches.filter(b => b.status === 'waiting' || b.status === 'processing')

	return (
		<div className="grid grid-cols-1 md:grid-cols-2 gap-8">
			<div className="p-6 rounded-lg shadow-sm">
				<h3 className="text-xl font-medium mb-4 flex items-center gap-2">
					<span className="w-3 h-3 rounded-full bg-red-500 animate-pulse"></span>
					Live
				</h3>
				<LiveMatchesList liveMatches={live} styles={styles}/>
			</div>
		
			<div className="p-6 rounded-lg shadow-sm">
				<h3 className="text-xl font-medium mb-4 text-gray-700">Planned</h3>
				<LiveMatchesList liveMatches={planned} styles={styles}/>
			</div>
		</div>
	);
}