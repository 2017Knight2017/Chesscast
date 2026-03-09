export const parseMove = (moveStr: string) => {
	if (moveStr.length < 4) return "...";
	
	return moveStr.substring(2, 4);
};