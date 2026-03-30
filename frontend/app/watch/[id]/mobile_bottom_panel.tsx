'use client';

import { useState } from 'react';
import { MoveList } from './move_list';
import { SpectatorList } from './spectator_list';
import { ViewerStatus } from '@/hooks/use_viewer_counts';

interface MobileBottomPanelProps {
	matchId: string;
	onInspectUser: (status: ViewerStatus) => void;
}

export function MobileBottomPanel({ matchId, onInspectUser }: MobileBottomPanelProps) {
	const [activeTab, setActiveTab] = useState<'moves' | 'spectators'>('moves');

	return (
		<div className="flex flex-col h-[40vh] bg-[#2a1b0e] border-t border-[#8b5e34]/30">
			<div className="flex border-b border-[#8b5e34]/20">
				<button
					onClick={() => setActiveTab('moves')}
					className={`flex-1 py-3 text-sm font-bold uppercase tracking-wider transition-colors ${
						activeTab === 'moves'
							? 'bg-[#8b5e34] text-[#f4ead5]'
							: 'text-[#f4ead5]/60 hover:text-[#f4ead5]'
					}`}
				>
					Moves
				</button>
				<button
					onClick={() => setActiveTab('spectators')}
					className={`flex-1 py-3 text-sm font-bold uppercase tracking-wider transition-colors ${
						activeTab === 'spectators'
							? 'bg-[#8b5e34] text-[#f4ead5]'
							: 'text-[#f4ead5]/60 hover:text-[#f4ead5]'
					}`}
				>
					Spectators
				</button>
			</div>
			<div className="flex-1 overflow-hidden relative">
				{activeTab === 'moves' ? (
					<div className="h-full overflow-auto">
						<MoveList id={matchId} />
					</div>
				) : (
					<div className="h-full overflow-auto">
						<SpectatorList id={matchId} onInspectUser={onInspectUser} />
					</div>
				)}
			</div>
		</div>
	);
}
