export interface Match {
	id: string;
	title: string;
	author: string;
	timeControl: number
	status: "waiting"|"in_progress"|"finished"
	white: { name: string; time: string; timeMs?: number };
	black: { name: string; time: string; timeMs?: number };
	fen: string;
	viewerCount: number;
}

export interface Move {
	evaluations: number[],
	turn: "w"|"b",
	history: string[],
	fen: string,
	whiteTimeMs: number,
	blackTimeMs: number,
}

export interface MoveRecord {
	num: number,
	white: string,
	black: string,
}

export interface SyncPayload {
	fen: string;
	whiteTimeMs: number;
	blackTimeMs: number;
}
