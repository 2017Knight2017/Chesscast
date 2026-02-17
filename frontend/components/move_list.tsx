'use client';

import { useEffect, useState } from "react";

export default function MoveList() {
	const [moves, setMoves] = useState<string[]>(["e4","e4","e4","e4","e4","e4","e4","e4","e4","e4","e4","e4","e4","e4","e4","e4","e4","e4","e4","e4","e4","e4","e4","e4","e4","e4","e4","e4","e4","e4","e4","e4","e4","e4","e4","e4","e4","e4","e4","e4","e4","e4","e4","e4","e4"]);

	const pairs = [];
	for (let i = 0; i < moves.length; i += 2) {
		pairs.push({
			num: Math.floor(i / 2) + 1,
			white: moves[i],
			black: moves[i + 1] || '...',
		});
	}

	const addMove = (new_move: string) => {
		setMoves((prev) => [...prev, new_move]);
	};
	
	return (
		<div className="bg-[#f4ead5] text-[#3e2b1d] shadow-inner p-6 border-l-4 border-[#8b5e34] font-mono">
			<h3 className="text-center border-b mb-2 sepia">Ходы партии</h3>
			<div className="col-span-3 border-b border-black/10 pb-1 mb-2 italic">№ — Белые — Черные</div>
			<div className="h-120 gap-x-10 [column-count:2] [column-rule:1px_solid_rgba(0,0,0,0.1)] [column-fill:auto]">
				{pairs.map((pair) => (
					<div key={pair.num} className="flex justify-between mb-1 text-sm border-b border-dotted border-black/10">
						<span className="w-6 opacity-50">{pair.num}.</span>
						<span className="flex-1 font-bold transform-[rotate(0.1deg)]">{pair.white}</span>
						<span className="flex-1 font-bold transform-[rotate(-0.1deg)] text-right">{pair.black}</span>
					</div>
				))}
			</div>
		</div>
	);
}