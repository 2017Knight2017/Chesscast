export const formatTime = (seconds: number): string => {
	const h = Math.floor(seconds / 3600);
	const m = Math.floor((seconds % 3600) / 60);
	const s = seconds % 60;
	const mm = m.toString().padStart(2, '0');
	const ss = s.toString().padStart(2, '0');
	
	if (h < 1) return `${mm}:${ss}`;
	else return `${h}:${mm}:${ss}`;
};