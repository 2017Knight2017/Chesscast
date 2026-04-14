export interface Match {
	id: string;
	title: string;
	author: string;
	timeControl: number;
	status: "processing" | "waiting" | "in_progress" | "finished";
	white: { name: string; timeMs?: number };
	black: { name: string; timeMs?: number };
	fen: string;
	viewerCount: number;
	history?: string[];
	evaluations?: number[];
	timesRemaining?: number[];
	outcome?: string;
	newestMoveAt?: number;
	isFollowed?: boolean;
}

export interface Move {
	evaluations: number[];
	timesRemaining: number[];
	turn: "w" | "b";
	history: string[];
	fen: string;
	whiteTimeMs: number;
	blackTimeMs: number;
	newestMoveAt: number;
}

export interface NewMoveData {
	matchId: string;
	move: string;
	evaluation: number;
	fen: string;
	whiteTimeMs: number;
	blackTimeMs: number;
	newestMoveAt: number;
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
	newestMoveAt: number;
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

export interface UserMatchesResponse {
	matches: Match[];
	total: number;
	page: number;
	limit: number;
	totalPages: number;
}
