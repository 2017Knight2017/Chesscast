'use client';

import { useBroadcast } from "@/hooks/use_broadcast";
import { MoveTreeNode, MoveRecord } from "@/types/types"
import { useEffect, useMemo, useRef } from "react";
import { BackToLiveButton } from "./back_to_live_button";
import { useAnalysis } from "@/context/analysis_context";

interface MoveListProps {
	id: string;
	matchHistory?: string[];
}

function getBranchColor(level: number, branchIndex: number): string {
	const hue = (branchIndex * 137.508) % 360;
	return `hsla(${hue}, 70%, 50%, 0.25)`;
}

function arraysEqual(a: number[], b: number[]): boolean {
	if (a.length !== b.length) return false;
	for (let i = 0; i < a.length; i++) {
		if (a[i] !== b[i]) return false;
	}
	return true;
}

function MoveNode({
	node,
	path,
	level = 0,
	currentPath,
	onPathClick,
}: {
	node: MoveTreeNode;
	path: number[];
	level?: number;
	currentPath: number[];
	onPathClick: (path: number[]) => void;
}) {
	const isActive = arraysEqual(path, currentPath);
	const bgColor = level > 0 ? getBranchColor(level, path[level] || 0) : undefined;

	return (
		<div className="flex flex-col">
			<span
				onClick={() => onPathClick(path)}
				className={`cursor-pointer px-1 rounded text-sm transition-colors ${
					isActive 
						? 'bg-amber-400 font-bold' 
						: 'hover:bg-black/5'
				}`}
				style={bgColor ? { backgroundColor: bgColor } : undefined}
			>
				{node.m}
			</span>
			{node.s && node.s.length > 0 && (
				<div className="ml-4 pl-2 border-l border-black/20">
					{node.s.map((subNode, subIdx) => (
						<MoveNode
							key={`${path.join('-')}-${subIdx}`}
							node={subNode}
							path={[...path, subIdx]}
							level={level + 1}
							currentPath={currentPath}
							onPathClick={onPathClick}
						/>
					))}
				</div>
			)}
		</div>
	);
}

export function MoveList({ id, matchHistory: propMatchHistory }: MoveListProps) {
	const { currentMoveData } = useBroadcast(id);
	const { isAnalysisMode, analysisTree, currentPath, setCurrentPath, selectedMoveIndex, setSelectedMoveIndex } = useAnalysis();
	
	const socketHistory = currentMoveData?.history || [];
	const matchHistory = propMatchHistory || socketHistory;
	
	const selectedHistoryIndex = selectedMoveIndex;
	
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
	}, [selectedHistoryIndex, currentPath]);

	const handleMoveClick = (moveIndex: number) => {
		if (isAnalysisMode) {
			setCurrentPath([]); 
			setSelectedMoveIndex(moveIndex);
		} else {
			setSelectedMoveIndex(moveIndex);
		}
	};

	const handlePathClick = (path: number[]) => {
		setCurrentPath(path);
	};

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

	const displayPairs = useMemo(() => {
		if (!isAnalysisMode || analysisTree.length === 0) {
			return pairs;
		}
		
		const result: MoveRecord[] = [];
		for (let i = 0; i < matchHistory.length; i += 2) {
			result.push({
				num: Math.floor(i / 2) + 1,
				white: matchHistory[i] || "...",
				black: matchHistory[i + 1] || "...",
			});
		}
		return result;
	}, [isAnalysisMode, analysisTree, matchHistory, pairs]);

	const variationNodes = useMemo(() => {
		if (!isAnalysisMode || analysisTree.length === 0) {
			return [];
		}
		return analysisTree.map((node, rootIdx) => ({
			node,
			rootIdx,
		})).filter(({ rootIdx }) => rootIdx >= matchHistory.length);
	}, [isAnalysisMode, analysisTree, matchHistory.length]);

	if (!isAnalysisMode && !currentMoveData) return <div>Loading...</div>;

	return (
		<div className="bg-[#f4ead5] text-[#3e2b1d] shadow-inner p-6 border-l-4 border-[#8b5e34] font-mono">
			<h3 className="text-center border-b mb-2 sepia">Moves Record</h3>
			<div className="col-span-3 border-b border-black/10 pb-1 mb-2 italic"># — White — Black</div>

			<div className={`${isAnalysisMode ? 'h-40' : 'h-100'} overflow-x-auto overflow-y-hidden`}>
				<div 
					style={{
						display: 'flex',
						flexFlow: 'column wrap',
						height: '100%',
						alignContent: 'flex-start',
						overscrollBehaviorX: 'contain',
					}}
				>
					{displayPairs.map((pair, i) => {
						const whiteIndex = i * 2;
						const blackIndex = i * 2 + 1;

						let isWhiteActive, isBlackActive;

						if (isAnalysisMode) {
							const isAtMainline = currentPath.length === 0;
							isWhiteActive = isAtMainline && selectedMoveIndex === whiteIndex;
							isBlackActive = isAtMainline && selectedMoveIndex === blackIndex;
						} else {
							isWhiteActive = selectedMoveIndex === whiteIndex;
							isBlackActive = selectedMoveIndex === blackIndex;
						}
					
						return (
							<div 
								key={i}
								className="flex items-center mr-2 gap-1 w-32 h-8 border-r border-dotted border-black/5 break-inside-avoid"
								ref={isWhiteActive || isBlackActive ? activeRef : null}
							>
								<span className="text-[10px] text-slate-500 w-5">{pair.num}.</span>
						
								<button 
									onClick={() => handleMoveClick(whiteIndex)}
									onMouseDown={(e) => e.preventDefault()}
									className={`flex-1 text-sm rounded px-1 transition-colors text-left whitespace-nowrap ${
										isWhiteActive ? 'bg-amber-400 font-bold text-black' : 'hover:bg-black/5'
									}`}
								>
									{pair.white}
								</button>
								
								{pair.black && (
									<button 
										onClick={() => handleMoveClick(blackIndex)}
										onMouseDown={(e) => e.preventDefault()}
										className={`flex-1 text-sm rounded px-1 transition-colors text-left whitespace-nowrap ${
											isBlackActive ? 'bg-amber-400 font-bold text-black' : 'hover:bg-black/5'
										}`}
									>
										{pair.black}
									</button>
								)}
							</div>
						);
					})}

					{variationNodes.length > 0 && isAnalysisMode && (
						<div className="mt-2 pt-2 border-t border-black/20 w-full">
							<div className="flex items-center justify-between mb-2">
								<span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Variations</span>
							</div>
							<div className="flex flex-col gap-1">
								{variationNodes.map(({ node, rootIdx }) => (
									<MoveNode
										key={rootIdx}
										node={node}
										path={[rootIdx]}
										level={1}
										currentPath={currentPath}
										onPathClick={handlePathClick}
									/>
								))}
							</div>
						</div>
					)}
				</div>
			</div>
				
			<div className="mt-4">
				<BackToLiveButton />
			</div>
		</div>
	);
}
