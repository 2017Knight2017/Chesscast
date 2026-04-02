import React from 'react';

interface EvalBarProps {
	evaluation: number;
	isWhite: boolean;
	isHorizontal?: boolean; // Новый пропс
	hideText?: boolean;
}

export const EvalBar: React.FC<EvalBarProps> = ({ evaluation, isWhite, isHorizontal, hideText }) => {
	const getPercentage = (cp: number) => {
		if (cp > 1500) return 100;
		if (cp < -1500) return 0;
		return 100 / (1 + Math.pow(10, -0.002 * cp));
	};

	const whitePercentage = getPercentage(evaluation);
	const fillSize = isWhite ? whitePercentage : 100 - whitePercentage;

	return (
		<div className={`relative w-full h-full bg-[#312e2b] flex ${isHorizontal ? 'flex-row' : 'flex-col-reverse'}`}>
			<div 
				className="bg-[#ffffff] transition-all duration-500 ease-in-out"
				style={{ 
					height: isHorizontal ? '100%' : `${fillSize}%`, 
					width: isHorizontal ? `${fillSize}%` : '100%' 
				}}
			/>
			
			{/* Центрированный текст */}
			{!hideText && (
				<div className={`absolute flex items-center justify-center font-bold z-10 text-[12px] inset-0
					${whitePercentage > 50 ? 'text-black' : 'text-white'}`}>
					{Math.abs(evaluation / 100).toFixed(1)}
				</div>
			)}
		</div>
	);
};