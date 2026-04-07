"use client";

import { useMemo } from "react";

interface EvalBarProps {
	evaluation: number;
	isWhite: boolean;
	isHorizontal?: boolean;
	hideText?: boolean;
}

export function EvalBar({
	evaluation,
	isWhite,
	isHorizontal,
	hideText,
}: EvalBarProps) {
	const { displayValue, isMate, fillSize } = useMemo(() => {
		let val = evaluation;
		let mate = false;

		if (Math.abs(val) > 20000) {
			const isNegative = val < 0;
			val = (isNegative ? -30000 : 30000) - val;
			mate = true;
		}

		const getPercentage = (cp: number) => {
			if (cp > 1500) return 100;
			if (cp < -1500) return 0;
			return 100 / (1 + Math.pow(10, -0.002 * cp));
		};

		const whiteP = getPercentage(evaluation);
		const size = isWhite ? whiteP : 100 - whiteP;

		return {
			displayValue: (val / 100).toFixed(mate ? 0 : 1),
			isMate: mate,
			fillSize: size / 100,
			whitePercentage: whiteP,
		};
	}, [evaluation, isWhite]);

	const whitePercentage = (isWhite ? fillSize : 1 - fillSize) * 100;

	return (
		<div
			className={`relative w-full h-full bg-stone-900 flex overflow-hidden ${isHorizontal ? "flex-row-reverse" : "flex-col-reverse"}`}
		>
			<div
				className="absolute inset-0 bg-white transition-transform duration-300 ease-out origin-bottom left-0"
				style={{
					willChange: "transform",
					transform: isHorizontal
						? `scaleX(${fillSize})`
						: `scaleY(${fillSize})`,
					transformOrigin: isHorizontal ? "right" : "bottom",
				}}
			/>

			{!hideText && displayValue != "0.0" && (
				<div
					className={`absolute inset-0 flex items-center justify-center font-bold z-10 text-[12px] transition-colors duration-300
					${whitePercentage > 50 ? "text-black" : "text-white"}`}
				>
					{isMate && "#"}
					{displayValue}
				</div>
			)}
		</div>
	);
}
