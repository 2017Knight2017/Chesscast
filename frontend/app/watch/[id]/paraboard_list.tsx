'use client'

import { Dispatch, SetStateAction } from "react";

interface ParaboardListProps {
	id: string;
	setIsSpectatorTab?: Dispatch<SetStateAction<boolean>>;
}

export function ParaboardList({ id, setIsSpectatorTab }: ParaboardListProps) {
	console.log("[watch/[id]/parallel_boards_list.tsx:ParallelBoardsList]", { id });
	
	return (
		<div className="h-full flex flex-col p-4 border-l-4 border-amber-900 bg-orange-50 shadow-inner overflow-hidden">

			<div className="shrink-0 flex justify-between gap-2 border-b mb-2 pb-1 text-stone-900">
				<h3 className="font-mono">
					Paraboards List
				</h3>
				{setIsSpectatorTab && 
					<div className="ml-auto flex items-center gap-2">
						<button className="flex items-center justify-center" onClick={()=>setIsSpectatorTab(true)}>
							<svg width="24" height="24" viewBox="0 0 24 24" fill="#9f8e6e" className="block">
								<circle cx="12" cy="7" r="4" />
								<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
							</svg>
						</button>

						<div className="border-l border-amber-900/30 h-6 pr-1"></div>

						<button className="flex items-center justify-center">
							<svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true" className="block">
								<rect width="24" height="24" fill="#ffffd5"/>
								<rect x="0" y="0" width="12" height="12" fill="#9f8e6e"/>
								<rect x="12" y="12" width="12" height="12" fill="#9f8e6e"/>
							</svg>
						</button>
					</div>
				}
			</div>
			
		</div>
	);
}
