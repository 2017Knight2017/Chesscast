'use client';

import ChessBoard from "@/components/chess_board";
import Image from 'next/image';
import background from '@/public/bg-watch.png';
import MoveList from "@/components/move_list";
import SpectatorList from "@/components/spectator_list";

export default function WatchPage() {
	return (
		<>
		<header className="absolute top-0 left-0 w-full h-[6%] flex items-center justify-center z-20">
			<a href="#">
				<h1 className="text-3xl font-serif text-[#3e2b1d] opacity-80">Chesscast</h1>
			</a>
		</header>
		<main className="h-screen w-screen bg-vintage-paper bg-size-[100%_100%] overflow-hidden">
			<Image
				src={background}
				alt="Vintage background"
				placeholder="blur" // размытие при загрузке
				quality={100}
				fill
				sizes="100vw"
				className="-z-10 pointer-events-none object-fill"
			/>
			<div className="grid grid-cols-[300px_1fr_300px] size-full items-center px-10 gap-0 relative z-10">
				
				{/* ЛЕВАЯ КОЛОНКА */}
				<aside className="h-[75vh] flex flex-col justify-center">
					<div className="bg-[#f4ead5]/20 backdrop-blur-sm p-4 h-full border border-[#8b5e34]/20 shadow-lg">
						<SpectatorList spectators={[{id:"ds", name: "Иван Петров"}]} />
					</div>
				</aside>

				{/* ЦЕНТР (Доска) */}
				<section className="flex justify-center items-center">
					{/* max-w-[min(50vw,70vh)] - хитрость, чтобы доска не вылезала по высоте */}
					<div className="board-frame w-full max-w-[min(50vw,70vh)] aspect-square shadow-2xl p-[3%]">
						<ChessBoard />
					</div>
				</section>

				{/* ПРАВАЯ КОЛОНКА */}
				<aside className="h-[75vh] flex flex-col justify-center">
					<div className="bg-[#f4ead5]/20 backdrop-blur-sm p-4 h-full border border-[#8b5e34]/20 shadow-lg">
						<MoveList />
					</div>
				</aside>

			</div>
		</main>
		</>
	);
}