import React from 'react';

interface EvalBarProps {
	evaluation: number;
	isWhite: boolean;
	isHorizontal?: boolean;
	hideText?: boolean;
}

export function EvalBar({ evaluation, isWhite, isHorizontal, hideText }: EvalBarProps) {
	const getPercentage = (cp: number) => {
		if (cp > 1500) return 100;
		if (cp < -1500) return 0;
		return 100 / (1 + Math.pow(10, -0.002 * cp));
	};

	const whitePercentage = getPercentage(evaluation);
	const fillSize = isWhite ? whitePercentage : 100 - whitePercentage;

	let isMate = false;
	if (Math.abs(evaluation) > 20000) {
		const isNegative = evaluation < 0
		evaluation = (isNegative ? -30000 : 30000) - evaluation
		isMate = true
	}

	return (
		<div className={`relative w-full h-full bg-[#312e2b] flex ${isHorizontal ? 'flex-row' : 'flex-col-reverse'}`}>
			<div 
				className="bg-[#ffffff] transition-all duration-500 ease-in-out"
				style={{ 
					height: isHorizontal ? '100%' : `${fillSize}%`, 
					width: isHorizontal ? `${fillSize}%` : '100%' 
				}}
			/>
			
			{!hideText && (
				<div className={`absolute flex items-center justify-center font-bold z-10 text-[12px] inset-0
					${whitePercentage > 50 ? 'text-black' : 'text-white'}`}>
					{isMate && "M"}{(evaluation / 100).toFixed(isMate ? 0 : 1)}
				</div>
			)}
		</div>
	);
};