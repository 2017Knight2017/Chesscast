export interface Match {
	id: string;
	title: string;
	author: string;
	timeControl: number;
	status: "processing" | "waiting" | "in_progress" | "finished";
	white: { name: string; time: string; timeMs?: number };
	black: { name: string; time: string; timeMs?: number };
	fen: string;
	viewerCount: number;
	history?: string[];
	evaluations?: number[];
}

export interface Move {
	evaluations: number[];
	turn: "w" | "b";
	history: string[];
	fen: string;
	whiteTimeMs: number;
	blackTimeMs: number;
}

export interface MoveRecord {
	num: number;
	white: string;
	black: string;
}

export interface SyncPayload {
	fen: string;
	whiteTimeMs: number;
	blackTimeMs: number;
}

export interface MoveTreeNode {
	m: string;
	s?: MoveTreeNode[];
}

export interface AnalysisState {
	isAnalysisMode: boolean;
	inspectedUserId: number | null;
	analysisTree: MoveTreeNode[];
	currentPath: number[];
	matchId: string | null;
}
