'use client';

interface AnalysisPromptProps {
	isBegin: boolean;
	onYes: () => void;
	onNo: () => void;
}

export function AnalysisPrompt({ isBegin, onYes, onNo }: AnalysisPromptProps) {
	return (
		<div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
			<div className="bg-[#f4ead5] border-2 border-[#8b5e34] p-6 rounded-lg shadow-2xl max-w-md">
				<p className="text-[#3e2b1d] text-lg font-serif mb-4">
					Would you like to {isBegin ? 'begin' : 'continue'} your own analysis?
				</p>
				<div className="flex gap-4 justify-end">
					<button
						onClick={onNo}
						className="px-4 py-2 text-sm text-[#5a3e2b] hover:bg-black/5 rounded transition-colors"
					>
						No
					</button>
					<button
						onClick={onYes}
						className="px-4 py-2 bg-[#8b5e34] text-white rounded hover:bg-[#6d4a29] transition-colors"
					>
						Yes
					</button>
				</div>
			</div>
		</div>
	);
}

interface SavePromptProps {
	onSave: () => void;
	onDiscard: () => void;
	onCancel: () => void;
}

export function SavePrompt({ onSave, onDiscard, onCancel }: SavePromptProps) {
	return (
		<div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
			<div className="bg-[#f4ead5] border-2 border-[#8b5e34] p-6 rounded-lg shadow-2xl max-w-md">
				<p className="text-[#3e2b1d] text-lg font-serif mb-4">
					Save Analysis?
				</p>
				<div className="flex gap-4 justify-end">
					<button
						onClick={onCancel}
						className="px-4 py-2 text-sm text-[#5a3e2b] hover:bg-black/5 rounded transition-colors"
					>
						Cancel
					</button>
					<button
						onClick={onDiscard}
						className="px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded transition-colors"
					>
						Discard
					</button>
					<button
						onClick={onSave}
						className="px-4 py-2 bg-[#8b5e34] text-white rounded hover:bg-[#6d4a29] transition-colors"
					>
						Save
					</button>
				</div>
			</div>
		</div>
	);
}
