'use client';

import { useBroadcast } from "@/hooks/use_broadcast";
import { MoveRecord } from "@/types/types"
import { useMemo } from "react";

export function MoveList({ id }: { id: string }) {
	const { currentMoveData } = useBroadcast(id);
	const history = currentMoveData?.history || [];
    
    const pairs = useMemo(() => {
        const p: MoveRecord[] = [];
        for (let i = 0; i < history.length; i += 2) {
            p.push({
                num: Math.floor(i / 2) + 1,
                white: history[i] || "...",
                black: history[i + 1] || "...",
            });
        }
        return p;
    }, [history]);

    if (!currentMoveData) return <div>Loading...</div>;
	
	return (
		<div className="bg-[#f4ead5] text-[#3e2b1d] shadow-inner p-6 border-l-4 border-[#8b5e34] font-mono">
			<h3 className="text-center border-b mb-2 sepia">Moves Record</h3>
			<div className="col-span-3 border-b border-black/10 pb-1 mb-2 italic"># — White — Black</div>
			<div className="h-120 gap-x-10 [column-count:2] [column-rule:1px_solid_rgba(0,0,0,0.1)] [column-fill:auto]">
				{pairs.map((pair) => (
					<div key={pair.num} className="flex justify-between mb-1 text-sm border-b border-dotted border-black/10">
						<span className="w-6 opacity-50">{pair.num}.</span>
						<span className="flex-1 font-bold">{pair.white}</span>
						<span className="flex-1 font-bold text-right">{pair.black}</span>
					</div>
				))}
			</div>
		</div>
	);
}