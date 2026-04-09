"use client";

import { useAnalysisState } from "@/context/analysis_context";

export function BackToLiveButton() {
	console.log("[watch/[id]/back_to_live_button.tsx:BackToLiveButton]");
	const { selectedMoveIndex, setSelectedMoveIndex } = useAnalysisState();

	const isPreviewing = selectedMoveIndex !== null;

	const handleBackToLive = () => {
		console.log("[watch/[id]/back_to_live_button.tsx:handleBackToLive]");
		setSelectedMoveIndex(null);
	};

	if (!isPreviewing) return null;

	return (
		<button
			onClick={handleBackToLive}
			className="flex items-center px-4 py-2 bg-oak-light hover:bg-oak text-stone-900 text-sm font-bold tracking-widest uppercase rounded transition-colors border border-oak-dark/50 ring-1 ring-inset ring-white/20 shadow-sm"
		>
			<span className="relative flex h-2 w-2">
				<span className="absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
				<span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
			</span>
			Back to Live
		</button>
	);
}
