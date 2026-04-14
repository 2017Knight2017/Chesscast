import { LiveMatchesList } from "@/components/live_matches_list";
import { Pagination } from "@/components/pagination";
import { redirect, notFound } from "next/navigation";

const CATEGORIES = ["live", "planned", "finished"] as const;
type Category = (typeof CATEGORIES)[number];

const CATEGORY_STATUS_MAP: Record<Category, string[]> = {
	live: ["in_progress"],
	planned: ["waiting", "processing"],
	finished: ["finished"],
};

const CATEGORY_TITLES: Record<Category, string> = {
	live: "Live Matches",
	planned: "Planned Matches",
	finished: "Finished Matches",
};

function isValidCategory(cat: string | undefined): cat is Category {
	return cat !== undefined && CATEGORIES.includes(cat as Category);
}

export default async function UserMatchesPage({
	params,
	searchParams,
}: {
	params: Promise<{ username: string }>;
	searchParams: Promise<{ category?: string; page?: string }>;
}) {
	const resolvedParams = await params;
	const resolvedSearchParams = await searchParams;

	const decodedUsername = decodeURIComponent(resolvedParams.username);
	const category = resolvedSearchParams.category;
	const pageParam = resolvedSearchParams.page;

	if (!isValidCategory(category)) {
		redirect(`/member/${decodedUsername}`);
	}

	const currentPage = parseInt(pageParam || "1", 10);
	if (isNaN(currentPage) || currentPage < 1) {
		redirect(
			`/member/${decodedUsername}/matches?category=${category}`
		);
	}

	const limit = 25;

	const res = await fetch(
		`${process.env.NEST_API_URL}/matches/${decodedUsername}/all?category=${category}&page=${currentPage}&limit=${limit}`,
		{
			cache: "no-store",
		}
	);

	if (!res.ok) {
		if (res.status === 404) {
			notFound();
		}
		return (
			<div className="max-w-6xl mx-auto p-6 pt-20">
				<h1 className="text-2xl font-bold text-red-600">
					Failed to load matches
				</h1>
			</div>
		);
	}

	const data = await res.json();
	const matches = data.matches || [];
	const totalPages = data.totalPages || 1;

	if (currentPage > totalPages) {
		redirect(
			`/member/${decodedUsername}/matches?category=${category}&page=${totalPages}`
		);
	}

	const styles =
		"grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6";

	return (
		<div className="max-w-6xl mx-auto p-6 pt-22 space-y-12">
			<h1 className="text-3xl font-serif font-bold border-b-2 border-oak/80 pb-4">
				{decodedUsername} — {CATEGORY_TITLES[category]}
			</h1>
			<a href={`/member/${decodedUsername}`} className="mb-0 -mt-6 block text-xl font-semibold text-slate-200/30 uppercase tracking-widest">
				← Back
			</a>

			<section className="space-y-6">
				<div className="flex justify-between items-end mt-4">
					<h2 className="text-2xl font-semibold border-oak/80 border-l-4 pl-4">
						{category === "live" && (
							<span className="w-3 h-3 rounded-full bg-red-500 animate-pulse inline-block mr-2" />
						)}
						{CATEGORY_TITLES[category]}
					</h2>
					<span className="text-sm text-slate-400">
						{data.total} matches
					</span>
				</div>

				{matches.length > 0 ? (
					<LiveMatchesList liveMatches={matches} styles={styles} maxItems={limit} />
				) : (
					<p className="text-slate-400 text-center py-12">
						No {category} matches for this user.
					</p>
				)}

				<Pagination
					currentPage={currentPage}
					totalPages={totalPages}
					category={category}
					basePath={`/member/${decodedUsername}/matches`}
					username={decodedUsername}
				/>
			</section>
		</div>
	);
}
