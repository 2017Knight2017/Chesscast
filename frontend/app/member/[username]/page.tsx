import { LiveMatchesList } from "@/components/live_matches_list";
import Link from "next/link";
import { Match } from "@/types/types";

export default async function DashboardPage({
	params,
}: {
	params: Promise<{ username: string }>;
}) {
	console.log("[member/[username]/page.tsx:DashboardPage]", { params });
	const resolvedParams = await params;
	const decodedUsername = decodeURIComponent(resolvedParams.username);
	const styles = "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6";

	try {
		const categories = ["live", "planned", "finished"] as const;
		const results = await Promise.all(
			categories.map((cat) =>
				fetch(
					`${process.env.NEST_API_URL}/matches/${decodedUsername}/all?category=${cat}&page=1&limit=100`,
					{ cache: "no-store" }
				)
			)
		);

		if (results.some((r) => !r.ok)) {
			console.log(results.map((r) => r.status));
			throw new Error("User not found");
		}

		const [liveData, plannedData, finishedData] = await Promise.all(
			results.map((r) => r.json())
		);

		const liveMatches: Match[] = liveData.matches || [];
		const plannedMatches: Match[] = plannedData.matches || [];
		const finishedMatches: Match[] = finishedData.matches || [];

		return (
			<div className="max-w-6xl mx-auto p-6 pt-20 space-y-12">
				<header>
					<h1 className="text-3xl font-serif font-bold border-b-2 border-oak/80 pb-4">
						{decodedUsername}
					</h1>
				</header>

				<section className="space-y-6">
					<div className="flex justify-between items-end">
						<h2 className="text-2xl font-semibold border-oak/80 border-l-4 pl-4">
							<span className="w-3 h-3 rounded-full bg-red-500 animate-pulse inline-block mr-2"></span>
							Live
						</h2>
						<Link
							href={`/member/${decodedUsername}/matches?category=live`}
							className="text-blue-400 text-sm hover:underline"
						>
							See All
						</Link>
					</div>
					<LiveMatchesList liveMatches={liveMatches} styles={styles} />
				</section>

				<section className="space-y-6">
					<div className="flex justify-between items-end">
						<h2 className="text-2xl font-semibold border-oak/80 border-l-4 pl-4">
							Planned
						</h2>
						<Link
							href={`/member/${decodedUsername}/matches?category=planned`}
							className="text-blue-400 text-sm hover:underline"
						>
							See All
						</Link>
					</div>
					<LiveMatchesList liveMatches={plannedMatches} styles={styles} />
				</section>

				<section className="space-y-6">
					<div className="flex justify-between items-end">
						<h2 className="text-2xl font-semibold border-oak/80 border-l-4 pl-4">
							Finished
						</h2>
						<Link
							href={`/member/${decodedUsername}/matches?category=finished`}
							className="text-blue-400 text-sm hover:underline"
						>
							See All
						</Link>
					</div>
					<LiveMatchesList liveMatches={finishedMatches} styles={styles} />
				</section>
			</div>
		);
	} catch (error) {
		return (
			<div className="max-w-6xl mx-auto p-6 pt-20">
				<h1 className="text-2xl font-bold text-red-600">User not found or error loading profile</h1>
			</div>
		);
	}
}