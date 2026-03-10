import { ChessBoard } from "@/components/chess_board";
import { MoveList } from "@/components/move_list";
import { SpectatorList } from "@/components/spectator_list";
import { notFound } from "next/navigation";
import { Match } from '@/types/types';
import { Suspense } from "react";

export default async function WatchPage({ params, searchParams }: { params: Promise<{ id: string }>, searchParams: Promise<{ move?: string }> }) {
	const { id } = await params;
	const res = await fetch(`${process.env.NEST_API_URL}/matches/${id}/state`);
	if (!res.ok) {
		console.log(await res.json());
		notFound();
	}
    const match: Match = await res.json();
	if (!match) {
		console.log(match)
		notFound();
	}
	
	return (
		<main className="h-screen w-screen bg-size-[100%_100%] overflow-hidden">
			<div className="grid grid-cols-[300px_1fr_300px] size-full items-center px-10 gap-0 relative z-10">
				
				{/* ЛЕВАЯ КОЛОНКА */}
				<aside className="h-[75vh] flex flex-col justify-center">
					<div className="bg-[#f4ead5]/20 backdrop-blur-sm p-4 h-full border border-[#8b5e34]/20 shadow-lg">
						<SpectatorList id={match.id} />
					</div>
				</aside>

				{/* ЦЕНТР (Доска) */}
				<section className="flex justify-center items-center">
					<div className="board-frame w-full max-w-[70vh] aspect-square shadow-2xl flex items-center justify-center">
						<div className="w-[83.5%] h-[83.5%]">
							<Suspense fallback={<div>Loading board...</div>}>
								<ChessBoard match={match} />
							</Suspense>
						</div>
					</div>
				</section>

				{/* ПРАВАЯ КОЛОНКА */}
				<aside className="h-[75vh] flex flex-col justify-center">
					<div className="bg-[#f4ead5]/20 backdrop-blur-sm p-4 h-full border border-[#8b5e34]/20 shadow-lg">
						<MoveList id={match.id}/>
					</div>
				</aside>

			</div>
		</main>
	);
}