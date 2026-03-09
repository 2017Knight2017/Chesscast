'use client'

import { useState } from "react";

interface Viewer {
	id: string;
	name: string;
}

export function SpectatorList({ spectators }: { spectators: Viewer[]; }) {
	const [selectedSpectator, setSelectedSpectator] = useState<Viewer | null>(null);
	
	return (
		<div className="w-full max-w-md p-6 bg-[#f2e6d0] border border-[#8b5e34]/30 shadow-inner font-serif">
			<h3 className="text-center text-[#3e2b1d] uppercase tracking-widest border-b border-[#8b5e34]/20 mb-4 pb-2 text-sm font-bold">Список зрителей</h3>
			<div className="grid h-75 [grid-template-columns: repeat(autofit, 50%)] gap-x-8">
				{spectators.map((spectator) => (
					<button
						key={spectator.id}
						onClick={() => setSelectedSpectator(spectator)}
						className="block w-full text-left mb-2 text-[#5a3e2b] hover:text-[#8b5e34] transition-colors group"
					>
						<span className="opacity-40 mr-1">❧</span>
						<span className="border-b border-transparent group-hover:border-[#8b5e34] py-0.5">
							{spectator.name}
						</span>
					</button>
				))}

				{selectedSpectator && (
					<div className="mt-6 p-4 bg-[#e8dac0] border-2 border-double border-[#8b5e34]/40 animate-in fade-in slide-in-from-bottom-2">
						<div className="flex justify-between items-start mb-2">
							<h4 className="font-bold text-[#3e2b1d]">Анализ: {selectedSpectator.name}</h4>
							<button 
								onClick={() => setSelectedSpectator(null)}
								className="text-xs uppercase opacity-50 hover:opacity-100"
							>
								[закрыть]
							</button>
						</div>
						<p className="text-xs leading-relaxed italic opacity-80">
							Здесь будет выводиться глубокий анализ позиции, предложенный данным участником, 
							его точность прогнозов и текущие предположения по партии...
						</p>
					</div>
				)}
			</div>
		</div>
	);


}