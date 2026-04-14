"use client";

import { useViewerCounts } from "@/hooks/use_viewer_counts";
import { LiveCard } from "@/components/live_card";
import { Match } from "@/types/types";

export function LiveMatchesList({
	liveMatches,
	styles,
	maxItems = 10,
}: {
	liveMatches: Match[];
	styles: string;
	maxItems?: number;
}) {
	console.log("[live_matches_list.tsx:LiveMatchesList]", {
		matchCount: liveMatches.length,
	});
	const displayMatches = liveMatches.slice(0, maxItems);
	const matchIds = displayMatches.map((m) => m.id);
	const { cumulativeCounts } = useViewerCounts(matchIds);

	return (
		<div className={styles}>
			{displayMatches.map((match: Match) => (
				<LiveCard
					key={match.id}
					match={match}
					viewerCount={
						cumulativeCounts[match.id] ?? match.viewerCount
					}
				/>
			))}

			{liveMatches.length === 0 && (
				<div className="col-span-full py-20 text-center border-2 border-dashed border-slate-800 rounded-2xl text-slate-500">
					No broadcasts yet!
				</div>
			)}
		</div>
	);
}
