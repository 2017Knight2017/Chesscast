import WatchMatchClient from "./watch_match_client";
import { Match } from "@/types/types";

export default async function WatchPage({
	params,
	searchParams,
}: {
	params: Promise<{ id: string }>;
	searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
	console.log("[watch/[id]/page.tsx:WatchPage]", { params });
	const matchId = (await params).id;
	const isParaboardTabActive = "paraboards" in (await searchParams);

	const res = await fetch(
		`${process.env.NEST_API_URL}/matches/${matchId}/state`,
		{
			headers: { "Content-Type": "application/json" },
		},
	);

	if (!res.ok) {
		return (
			<div className="p-10 text-center">
				Match not found or failed to load.
			</div>
		);
	}

	const match: Match = await res.json();

	return (
		<WatchMatchClient
			match={match}
			isParaboardTabActive={isParaboardTabActive}
		/>
	);
}
