export interface GameState {
	isStarted: boolean;
	history: string[];
}

export interface Match {
	id: string;
	title: string;
	author: string;
	white: { name: string; time: string; timeMs?: number };
	black: { name: string; time: string; timeMs?: number };
	status: "processing" | "waiting" | "in_progress" | "finished";
	timeControl: number;
	fen: string;
	viewerCount: number;
	history?: string[] | null;
	evaluations?: number[] | null;
	outcome?: string;
	newestMoveAt?: number;
}

export const ARCHETYPE_OPTIONS = {
	"Desired archetype. Keep empty if unsure": undefined,
	"Calculator": "calculator",
	"Intuitive Genius": "intuitive",
	"Chaos Attacker": "attacker",
	"Solid Pragmatist": "pragmatic",
	"Time Trouble Addict": "time_trouble",
	"Iron Fortress": "fortress",
	"Blunder Prone Gambler": "gambler",
	"Perfectionist": "perfectionist",
	"Tactical Berserker": "berserker",
	"Speed Demon": "speed_demon",
	"Psychological Grinder": "grinder",
};