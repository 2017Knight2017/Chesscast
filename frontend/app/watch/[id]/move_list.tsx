'use client';

import { useBroadcast } from "@/hooks/use_broadcast";
import { MoveRecord, MoveTreeNode } from "@/types/types"
import { useCallback, useEffect, useMemo, useRef } from "react";
import { BackToLiveButton } from "./back_to_live_button";
import { useAnalysisState } from "@/context/analysis_context";

interface MoveListProps {
	id: string;
	matchHistory?: string[];
}

const MoveNode = ({ node, path, branchPoint, currentPath, onPathClick }: { 
	node: MoveTreeNode, 
	path: number[], 
	branchPoint: number, 
	currentPath: number[], 
	onPathClick: (branchPoint: number, path: number[]) => void 
}) => {
	const isActive = currentPath.length === path.length && path.every((val, i) => val === currentPath[i]);
		
	return (
		<div className="inline-block">
			<button 
				onClick={() => onPathClick(branchPoint, path)}
				className={`inline-block text-[11px] rounded px-1 transition-colors hover:bg-black/5 ${
					isActive ? 'bg-amber-400 font-bold text-black' : 'text-slate-700 underline decoration-dotted'
				}`}
			>
				{node.m}
			</button>

			{node.s && node.s.length > 0 && (
				<div className="inline">
					{node.s.map((childNode, childIdx) => {
						const childPath = [...path, childIdx];
						return (
							<MoveNode
								key={childIdx}
								node={childNode}
								path={childPath}
								branchPoint={branchPoint}
								currentPath={currentPath}
								onPathClick={onPathClick}
							/>
						);
					})}
				</div>
			)}
		</div>
	);
};

export function MoveList({ id, matchHistory: propMatchHistory }: MoveListProps) {
	const { currentMoveData } = useBroadcast(id);
	const { 
		isAnalysisMode, 
		analysisTree, 
		currentPath, 
		setCurrentPath, 
		selectedMoveIndex, 
		setSelectedMoveIndex, 
		deleteBranch 
	} = useAnalysisState();
	
	const socketHistory = currentMoveData?.history || [];
	const matchHistory = propMatchHistory || socketHistory;
	
	const activeRef = useRef<HTMLDivElement | null>(null);

	useEffect(() => {
		let rafId: number;
		
		if (activeRef.current) {
			rafId = requestAnimationFrame(() => {
				activeRef.current?.scrollIntoView({
					behavior: 'smooth',
					block: 'nearest',
					inline: 'center' 
				});
			});
		}
		
		return () => {
			if (rafId) cancelAnimationFrame(rafId);
		};
	}, [selectedMoveIndex, currentPath]);

	const handleMoveClick = (moveIndex: number) => {
		setCurrentPath([]); 
		setSelectedMoveIndex(moveIndex);
	};

	const handlePathClick = useCallback((branchPoint: number, path: number[]) => {
		setSelectedMoveIndex(branchPoint);
		setCurrentPath(path);
	}, [setCurrentPath, setSelectedMoveIndex]);

	const scrollToActive = useCallback((node: HTMLButtonElement | null) => {
		if (node) {
			node.scrollIntoView({
				behavior: 'smooth',
				block: 'nearest',
				inline: 'center'
			});
		}
	}, []);

	const pairs = useMemo(() => {
		const p: MoveRecord[] = [];
		for (let i = 0; i < matchHistory.length; i += 2) {
			p.push({
				num: Math.floor(i / 2) + 1,
				white: matchHistory[i] || "...",
				black: matchHistory[i + 1] || "...",
			});
		}
		return p;
	}, [matchHistory]);

	if (!isAnalysisMode && !currentMoveData) return <div>Loading...</div>;

	return (
	<div className="h-full flex flex-col bg-[#f4ead5] text-[#3e2b1d] shadow-inner p-6 border-l-4 border-[#8b5e34] font-mono overflow-hidden">
		
		<div className="shrink-0 flex justify-between items-center border-b mb-2 pb-1">
			<h3 className="sepia">Moves Record</h3>
			{isAnalysisMode && currentPath.length > 0 && selectedMoveIndex !== null && (
				<button 
					onClick={() => deleteBranch(selectedMoveIndex, currentPath)}
					className="text-[10px] text-red-500 hover:text-red-700 transition-colors uppercase font-bold flex items-center gap-1"
					title="Delete current variation"
				>
					<span>Delete Branch</span>
					<span className="text-xs">×</span>
				</button>
			)}
		</div>

		<div className="flex-1 min-h-0 overflow-y-auto mb-4 pr-2 custom-scrollbar">
			<div className="flex flex-col gap-1">
				{/* Starting position for variations before the first move */}
				{isAnalysisMode && analysisTree[-1] && (
					<div className="pl-6 py-1 border-l-2 border-amber-200 bg-amber-50/30 rounded-r my-1">
						<span className="text-[10px] text-slate-400 italic mr-2">alt start:</span>
						{analysisTree[-1].map((node, idx) => (
							<MoveNode 
								key={idx} 
								node={node} 
								path={[idx]} 
								branchPoint={-1} 
								currentPath={selectedMoveIndex === -1 ? currentPath : []} 
								onPathClick={handlePathClick} 
							/>
						))}
					</div>
				)}

				{pairs.map((pair, i) => {
					const whiteIndex = i * 2;
					const blackIndex = i * 2 + 1;
					
					const isWhiteActive = currentPath.length === 0 && selectedMoveIndex === whiteIndex;
					const isBlackActive = currentPath.length === 0 && selectedMoveIndex === blackIndex;

					return (
						<div key={i} className="flex flex-col">
							<div className="flex items-center gap-2 h-7 group">
								<span className="text-[10px] text-slate-500 w-6 shrink-0">{pair.num}.</span>
								
								<div className="flex flex-1 gap-1">
									<button 
										onClick={() => handleMoveClick(whiteIndex)}
										className={`flex-1 text-sm rounded px-1 text-left whitespace-nowrap transition-colors ${
											isWhiteActive ? 'bg-amber-400 font-bold text-black shadow-sm' : 'hover:bg-black/5'
										}`}
										ref={isWhiteActive ? scrollToActive : null}
									>
										{pair.white}
									</button>
									
									{pair.black !== "..." && (
										<button 
											onClick={() => handleMoveClick(blackIndex)}
											className={`flex-1 text-sm rounded px-1 text-left whitespace-nowrap transition-colors ${
												isBlackActive ? 'bg-amber-400 font-bold text-black shadow-sm' : 'hover:bg-black/5'
											}`}
											ref={isBlackActive ? scrollToActive : null}
										>
											{pair.black}
										</button>
									)}
								</div>
							</div>

							{/* Variations for white move */}
							{isAnalysisMode && analysisTree[whiteIndex] && (
								<div className="pl-6 py-1 border-l-2 border-amber-200 bg-amber-50/30 rounded-r my-0.5 ml-6">
									<span className="text-[10px] text-slate-400 italic mr-2">alt:</span>
									{analysisTree[whiteIndex].map((node, idx) => (
										<MoveNode 
											key={idx} 
											node={node} 
											path={[idx]} 
											branchPoint={whiteIndex} 
											currentPath={selectedMoveIndex === whiteIndex ? currentPath : []} 
											onPathClick={handlePathClick} 
										/>
									))}
								</div>
							)}

							{/* Variations for black move */}
							{isAnalysisMode && pair.black !== "..." && analysisTree[blackIndex] && (
								<div className="pl-6 py-1 border-l-2 border-amber-200 bg-amber-50/30 rounded-r my-0.5 ml-6">
									<span className="text-[10px] text-slate-400 italic mr-2">alt:</span>
									{analysisTree[blackIndex].map((node, idx) => (
										<MoveNode 
											key={idx} 
											node={node} 
											path={[idx]} 
											branchPoint={blackIndex} 
											currentPath={selectedMoveIndex === blackIndex ? currentPath : []} 
											onPathClick={handlePathClick} 
										/>
									))}
								</div>
							)}
						</div>
					);
				})}
			</div>
		</div>
			
		<div className="shrink-0 mt-auto pt-4 border-t border-black/5">
			<BackToLiveButton />
		</div>
	</div>
);
}
