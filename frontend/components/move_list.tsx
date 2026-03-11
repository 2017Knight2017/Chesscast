'use client';

import { useBroadcast } from "@/hooks/use_broadcast";
import { MoveRecord } from "@/types/types"
import { useEffect, useMemo, useRef } from "react";
import { BackToLiveButton } from "./back_to_live_button";
import { useSearchParams } from "next/navigation";

export function MoveList({ id }: { id: string }) {
	const { currentMoveData } = useBroadcast(id);
	const history = currentMoveData?.history || [];

	const searchParams = useSearchParams();
	const activeMoveIndex = searchParams.get('move') !== null 
		? parseInt(searchParams.get('move')!) 
		: null;

	const activeRef = useRef<HTMLDivElement | null>(null);

	useEffect(() => {
		if (activeRef.current) {
			activeRef.current.scrollIntoView({
				behavior: 'smooth',
				block: 'nearest',
				inline: 'center'
			});
		}
	}, [activeMoveIndex]);
		
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

	const handleMoveClick = (moveIndex: number) => {
		const params = new URLSearchParams(window.location.search);
		params.set('move', moveIndex.toString());
		const newUrl = `${window.location.pathname}?${params.toString()}`;

		window.history.replaceState(null, '', newUrl);

		const event = new PopStateEvent('popstate');
		window.dispatchEvent(event);
	};
	
	return (
		<div className="bg-[#f4ead5] text-[#3e2b1d] shadow-inner p-6 border-l-4 border-[#8b5e34] font-mono">
			<h3 className="text-center border-b mb-2 sepia">Moves Record</h3>
			<div className="col-span-3 border-b border-black/10 pb-1 mb-2 italic"># — White — Black</div>

			{/* Обертка для скролла */}
			<div className="h-120 overflow-x-auto overflow-y-hidden">
				<div 
					style={{
						display: 'flex',
						flexFlow: 'column wrap',
						height: '100%',
						alignContent: 'flex-start',
						overscrollBehaviorX: 'contain',
					}}
				>
					{pairs.map((pair, i) => {
						const whiteIndex = i * 2;
						const blackIndex = i * 2 + 1;
						const isWhiteActive = activeMoveIndex === whiteIndex ? activeMoveIndex > -1 : false;
						const isBlackActive = activeMoveIndex === blackIndex ? activeMoveIndex > -1 : false;

						return (
							<div 
								key={i}
								className="flex items-center mr-2 gap-1 w-32 h-8 border-r border-dotted border-black/5 break-inside-avoid"
								ref={isWhiteActive || isBlackActive ? activeRef : null}
							>
								<span className="text-[10px] text-slate-500 w-5">{pair.num}.</span>

								<button 
									onClick={() => handleMoveClick(whiteIndex)}
									className={`flex-1 text-sm rounded px-1 transition-colors text-left whitespace-nowrap ${
										isWhiteActive ? 'bg-amber-300/60 font-bold' : 'hover:bg-black/5'
									}`}
								>
									{pair.white}
								</button>
								
								{pair.black && (
									<button 
										onClick={() => handleMoveClick(blackIndex)}
										className={`flex-1 text-sm rounded px-1 transition-colors text-left whitespace-nowrap ${
											isBlackActive ? 'bg-amber-300/60 font-bold' : 'hover:bg-black/5'
										}`}
									>
										{pair.black}
									</button>
								)}
							</div>
						);
					})}
				</div>
			</div>
				
			<div className="mt-4">
				<BackToLiveButton />
			</div>
		</div>
	);
}