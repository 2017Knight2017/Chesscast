import { LiveMatchesList } from "@/components/live_matches_list";

export default async function HomePage() {
	console.log("[page.tsx:HomePage]");
	const [liveRes, plannedRes] = await Promise.all([
		fetch(`${process.env.NEST_API_URL}/matches/live`, { headers: { 'Content-Type': 'application/json' } }),
        fetch(`${process.env.NEST_API_URL}/matches/planned`, { headers: { 'Content-Type': 'application/json' } })
    ]);
	const [liveMatches, plannedMatches]  = await Promise.all([ liveRes.json(), plannedRes.json() ]);
	const styles = 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6';

	return (
		<main className="max-w-7xl mx-auto px-6 py-12">
			<section>
				<div className="flex justify-between items-end mb-6">
						<h2 className="text-xl font-semibold text-slate-200 uppercase tracking-widest">Live</h2>
						<button className="text-blue-400 text-sm hover:underline">See All</button>
				</div>
				<LiveMatchesList liveMatches={liveMatches} styles={styles} />
			</section>
			<section>
				<div className="flex justify-between items-end mb-6">
						<h2 className="text-xl font-semibold text-slate-200 uppercase tracking-widest">Planned</h2>
						<button className="text-blue-400 text-sm hover:underline">See All</button>
				</div>
				<LiveMatchesList liveMatches={plannedMatches} styles={styles} />
			</section>
		</main>
	);
}