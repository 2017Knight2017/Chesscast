'use client';

import { useViewerCounts } from '@/hooks/use_viewer_counts';
import { LiveCard } from "@/components/live_card";
import { Match } from '@/types/types';

export default function LiveMatchesList({ liveMatches }: { liveMatches: Match[] }) {
	const matchIds = liveMatches.map(m => m.id);
	const viewerCounts = useViewerCounts(matchIds);

	return (
		<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
			{liveMatches.map((match: Match) => (
				<LiveCard key={match.id} match={match} viewerCount={viewerCounts[match.id] ?? match.viewerCount} />
			))}
			
			{liveMatches.length === 0 && (
				<div className="col-span-full py-20 text-center border-2 border-dashed border-slate-800 rounded-2xl text-slate-500">
					 No active broadcasts yet. Create <a href="/new">your own</a>!
				</div>
			)}
		</div>
	);
}