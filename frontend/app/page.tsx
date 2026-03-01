import { MOCK_LIVE_MATCHES } from '@/mocks/matches';
import LiveMatchesList from "@/components/live_matches_list";
import { Match } from "@/types/types";
import { useViewerCounts } from '@/hooks/use_viewer_counts';

export default async function HomePage() {
	const res = await fetch(`${process.env.NEST_API_URL}/matches/live`, { next: { revalidate: 30 } });
	const liveMatches = await res.json();
	const matchIds = liveMatches.map((match: Match) => match.id);

	return (
		<main className="max-w-7xl mx-auto px-6 py-12">
			<section>
				<div className="flex justify-between items-end mb-6">
						<h2 className="text-xl font-semibold text-slate-200 uppercase tracking-widest">Live</h2>
						<button className="text-blue-400 text-sm hover:underline">See All</button>
				</div>

				{/* СЕТКА КАРТОЧЕК */}
				<LiveMatchesList liveMatches={liveMatches} />
			</section>
		</main>
	);
}