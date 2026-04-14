import { LiveMatchesList } from "@/components/live_matches_list";
import { Pagination } from "@/components/pagination";
import { redirect } from "next/navigation";

const CATEGORIES = ["live", "planned"] as const;
type Category = (typeof CATEGORIES)[number];

const CATEGORY_STATUS_MAP: Record<Category, string[]> = {
	live: ["in_progress"],
	planned: ["waiting", "processing"],
};

const CATEGORY_TITLES: Record<Category, string> = {
	live: "Live Matches",
	planned: "Planned Matches",
};

function isValidCategory(cat: string | undefined): cat is Category {
	return cat !== undefined && CATEGORIES.includes(cat as Category);
}

export default async function AllMatchesPage({
	searchParams,
}: {
	searchParams: Promise<{ category?: string; page?: string }>;
}) {
	const resolvedSearchParams = await searchParams;
	const category = resolvedSearchParams.category;
	const pageParam = resolvedSearchParams.page;

	if (!isValidCategory(category)) {
		redirect("/");
	}

	const currentPage = parseInt(pageParam || "1", 10);
	if (isNaN(currentPage) || currentPage < 1) {
		redirect(`/all-matches?category=${category}`);
	}

	const limit = 25;

	const endpoint =
		category === "live" ? "/matches/live" : "/matches/planned";

	const res = await fetch(
		`${process.env.NEST_API_URL}${endpoint}?page=${currentPage}&limit=${limit}`,
		{
			cache: "no-store",
		}
	);

	if (!res.ok) {
		return (
			<div className="max-w-7xl mx-auto px-6 pt-24 py-12">
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
			`/all-matches?category=${category}&page=${totalPages}`
		);
	}

	const styles =
		"grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6";

	return (
		<main className="max-w-7xl mx-auto px-6 pt-24 py-12 flex flex-col gap-8">
			<a href="/" className="text-xl font-semibold text-slate-200/30 uppercase tracking-widest">
				← Back
			</a>
			<section>
				<div className="flex justify-between items-end mb-6">
					<h2 className="text-xl font-semibold text-slate-200 uppercase tracking-widest">
						{CATEGORY_TITLES[category]}
					</h2>
					<span className="text-sm text-slate-400">
						{data.total} matches
					</span>
				</div>

				<LiveMatchesList liveMatches={matches} styles={styles} maxItems={limit}/>

				<Pagination
					currentPage={currentPage}
					totalPages={totalPages}
					category={category}
					basePath="/all-matches"
				/>
			</section>
		</main>
	);
}
