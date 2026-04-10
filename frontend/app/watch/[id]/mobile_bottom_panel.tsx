"use client";

import { useState } from "react";
import { MoveList } from "./move_list";
import { SpectatorList } from "./spectator_list";
import { ViewerStatus } from "@/hooks/use_viewer_counts";
import { Move } from "@/types/types";
import { ParaboardList } from "./paraboard_list";

interface MobileBottomPanelProps {
	matchId: string;
	username: string | null;
	onInspectUser: (status: ViewerStatus) => void;
	currentMoveData: Move | null;
	usernames: Record<string, ViewerStatus[]>;
	guestCount: Record<string, number>;
	finalIsEnded: boolean;
}

export function MobileBottomPanel({
	matchId,
	username,
	onInspectUser,
	currentMoveData,
	usernames,
	guestCount,
	finalIsEnded,
}: MobileBottomPanelProps) {
	const [activeTab, setActiveTab] = useState<
		"moves" | "spectators" | "boards"
	>("moves");

	return (
		<div className="flex flex-col h-[40vh] bg-oak-dark border-t border-oak/30">
			<div className="flex">
				<button
					onClick={() => setActiveTab("moves")}
					className={`flex-1 py-3 text-sm font-bold uppercase tracking-wider transition-colors ${
						activeTab === "moves"
							? "bg-oak text-amber-50"
							: "text-amber-50/60 hover:text-amber-50"
					}`}
				>
					Moves
				</button>
				<button
					onClick={() => setActiveTab("boards")}
					className={`flex-1 py-3 text-sm font-bold uppercase tracking-wider transition-colors ${
						activeTab === "boards"
							? "bg-oak text-amber-50"
							: "text-amber-50/60 hover:text-amber-50"
					}`}
				>
					Boards
				</button>
				<button
					onClick={() => setActiveTab("spectators")}
					className={`flex-1 py-3 text-sm font-bold uppercase tracking-wider transition-colors ${
						activeTab === "spectators"
							? "bg-oak text-amber-50"
							: "text-amber-50/60 hover:text-amber-50"
					}`}
				>
					Spectators
				</button>
			</div>
			<div className="flex-1 overflow-hidden relative">
				<div className="h-full overflow-auto">
					{activeTab === "moves" && (
						<MoveList
							currentMoveData={currentMoveData}
							finalIsEnded={finalIsEnded}
						/>
					)}
					{activeTab === "boards" && 
						<ParaboardList 
							id={matchId}
							username={username}
						/>}
					{activeTab === "spectators" && (
						<SpectatorList
							id={matchId}
							onInspectUser={onInspectUser}
							usernames={usernames}
							guestCount={guestCount}
							currentMoveData={currentMoveData}
							isMobile={true}
						/>
					)}
				</div>
			</div>
		</div>
	);
}
