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
	move: string,
	evaluation: number,
	nextMoveDelay: number,
	moveIndex: number,
	turn: "w"|"b",
	history: string[],
	fen: string,
	whiteTimeMs: number,
	blackTimeMs: number,
}

export interface Broadcast {
	id: string;
	title: string;
	scheduledAt: string;
	status: 'in_progress' | 'waiting' | 'finished';
}

export interface MoveRecord {
	num: number,
	white: string,
	black: string,
}
