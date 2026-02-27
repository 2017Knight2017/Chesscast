import { MOCK_LIVE_MATCHES } from '@/mocks/matches';
import { LiveCard, Match } from "@/components/live_card";

export default async function HomePage() {
	//const res = await fetch(`${process.env.NEST_API_URL}/matches/live`, { next: { revalidate: 30 } });
	const liveMatches = MOCK_LIVE_MATCHES; //await res.json();

	return (
		<main className="max-w-7xl mx-auto px-6 py-12">
			<section>
				<div className="flex justify-between items-end mb-6">
						<h2 className="text-xl font-semibold text-slate-200 uppercase tracking-widest">Прямой эфир</h2>
						<button className="text-blue-400 text-sm hover:underline">Смотреть все</button>
				</div>

				{/* СЕТКА КАРТОЧЕК */}
				<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
					{liveMatches.map((match: Match) => (
						<LiveCard key={match.id} match={match} />
					))}
					
					{liveMatches.length === 0 && (
						<div className="col-span-full py-20 text-center border-2 border-dashed border-slate-800 rounded-2xl text-slate-500">
							 Сейчас нет активных трансляций. Запланируйте свою!
						</div>
					)}
				</div>
			</section>
		</main>
	);
}