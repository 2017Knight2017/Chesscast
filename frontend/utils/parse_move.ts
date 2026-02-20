export const parseMove = (moveStr: string) => {
  if (moveStr.length < 4) return null;
  
  return {
    from: moveStr.substring(0, 2),
    to: moveStr.substring(2, 4),
    // Если есть пятый символ (например, e7e8q), это превращение пешки
    promotion: moveStr.length === 5 ? moveStr[4] : undefined,
  };
};