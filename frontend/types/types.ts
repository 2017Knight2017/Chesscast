export interface Match {
	id: string;
    title: string;
    author: string;
    white: { name: string; time: string };
    black: { name: string; time: string };
	fen: string;
	viewerCount: number;
}