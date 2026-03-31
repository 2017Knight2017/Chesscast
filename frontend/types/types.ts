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
	outcome?: string;
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
	analysisTree: Record<number, MoveTreeNode[]>;
	currentPath: number[];
	matchId: string | null;
}

export interface CreateMatchData {
	pgn: string;
	archetypes: [string, string];
	whitePlayer: string;
	blackPlayer: string;
	title: string;
	timeControlNum?: number;
	timeControlStr?: string;
	timeIncrement: number;
	scheduledAt: string;
	isControlMove: boolean;
	isRepeatableControlMove: boolean;
	controlMove: number;
	bonusTimeMin: number;
	newTimeIncrement: number;
	nextControlMoveAfter: number;
}
