'use client';

import { useBroadcast } from "@/hooks/use_broadcast";
import { MoveTreeNode, MoveRecord } from "@/types/types"
import { useCallback, useEffect, useMemo, useRef } from "react";
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

const MoveNode = ({ node, path, level, currentPath, onPathClick }: any) => {
	const isActive = currentPath.length === path.length && path.every((val: number, i: number) => val === currentPath[i]);
		
	// Вычисляем номер хода и чья очередь (для веток это важно)
	// path.length определяет глубину хода
	const moveNumber = Math.floor((path.length - 1) / 2) + 1;
	const isWhite = path.length % 2 !== 0;

	return (
		<div className="inline">
			{/* Отображаем номер хода, если это ход белых или первый ход в ветке */}
			{(isWhite || level === 1) && (
				<span className="text-[10px] text-slate-400 mr-1">
					{moveNumber}{isWhite ? '.' : '...'}
				</span>
			)}

			<button 
				onClick={() => onPathClick(path)}
				className={`inline-block text-sm rounded px-1 transition-colors hover:bg-black/5 ${
					isActive ? 'bg-amber-400 font-bold text-black' : 'text-slate-700'
				}`}
			>
				{node.m}
			</button>

			{/* Рендерим дочерние узлы */}
			{node.s && node.s.length > 0 && (
				<div className="inline">
					{node.s.map((childNode: any, childIdx: number) => {
						const isMainBranch = childIdx === 0;
						const childPath = [...path, childIdx];

						if (isMainBranch) {
							// Продолжение текущей ветки — просто рендерим дальше в ту же строку
							return (
								<MoveNode
									key={childIdx}
									node={childNode}
									path={childPath}
									level={level + 1}
									currentPath={currentPath}
									onPathClick={onPathClick}
								/>
							);
						} else {
							// Параллельная ветка — выносим в скобки на новую строку или выделяем визуально
							return (
								<div key={childIdx} className="block ml-3 my-1 pl-2 border-l-2 border-slate-300 bg-black/5 rounded">
									<span className="text-[10px] text-slate-400 italic">alt: </span>
									<MoveNode
										node={childNode}
										path={childPath}
										level={1} // Сбрасываем уровень для новой ветки
										currentPath={currentPath}
										onPathClick={onPathClick}
									/>
								</div>
							);
						}
					})}
				</div>
			)}
		</div>
	);
};

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

	const handlePathClick = useCallback((path: number[]) => {
		setCurrentPath(path);
		setSelectedMoveIndex(null);
	}, [setCurrentPath, setSelectedMoveIndex]);

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
		if (!isAnalysisMode || !analysisTree || analysisTree.length === 0) return [];

		const roots: { node: any, absolutePath: number[] }[] = [];
		let currentLevel = analysisTree;
		const currentPathTracker: number[] = [];

		const historyLength = matchHistory.length;

		let depth = 0;
		while (currentLevel && currentLevel.length > 0) {
			for (let i = 0; i < currentLevel.length; i++) {
				const isFirstNode = i === 0;
				const hasHistoryAtThisDepth = depth < historyLength;

				if (!isFirstNode || !hasHistoryAtThisDepth) {
					roots.push({
						node: currentLevel[i],
						absolutePath: [...currentPathTracker, i]
					});

					if (!hasHistoryAtThisDepth) {
						return roots; 
					}
				}
			}

			currentPathTracker.push(0);
			currentLevel = currentLevel[0]?.s || [];
			depth++;
		}

		return roots;
	}, [analysisTree, isAnalysisMode, matchHistory]);

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
				</div>
			</div>

			{variationNodes.length > 0 && isAnalysisMode && (
				<div className="mt-2 pt-2 border-t border-black/20 w-full">
					<span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
						Variations
					</span>
					<div className="leading-relaxed">
						{variationNodes.map(({ node, absolutePath }) => (
							<div key={absolutePath.join('-')} className="mb-3 last:mb-0 p-2 bg-white/30 rounded border border-black/5">
								<MoveNode
									node={node}
									path={absolutePath}
									level={1}
									currentPath={currentPath}
									onPathClick={handlePathClick}
								/>
							</div>
						))}
					</div>
				</div>
			)}
				
			<div className="mt-4">
				<BackToLiveButton />
			</div>
		</div>
	);
}
