'use client';

import { useBroadcast } from "@/hooks/use_broadcast";
import { MoveRecord, MoveTreeNode } from "@/types/types"
import { useCallback, useEffect, useMemo, useRef } from "react";
import { BackToLiveButton } from "./back_to_live_button";
import { useAnalysisState } from "@/context/analysis_context";

interface VariationBlockProps {
    vars: MoveTreeNode[];
    branchPoint: number;
    currentPath: number[];
    activePoint: number | null;
    moveIndex: number;
    onPathClick: (branchPoint: number, path: number[]) => void;
}

interface MoveBtnProps { 
	text: string, 
	isActive: boolean, 
	onClick: () => void, 
}

const MoveNode = ({ node, path, branchPoint, currentPath, onPathClick, moveIndex }: { 
	node: MoveTreeNode, 
	path: number[], 
	branchPoint: number, 
	currentPath: number[], 
	onPathClick: (branchPoint: number, path: number[]) => void,
	moveIndex: number
}) => {
	const isActive = currentPath.length === path.length && path.every((val, i) => val === currentPath[i]);
	
	const isFirstInVar = path.length === 1;
	const isWhite = moveIndex % 2 === 0;
	let moveNum = Math.floor(moveIndex / 2) + 1;
	if (!isFirstInVar || !isWhite) moveNum++;

	let prefix = "";
	if (isFirstInVar) {
		prefix = moveNum + (isWhite ? "..." : ".");
	} else if (!isWhite) {
		prefix = moveNum + ". ";
	}

	return (
		<div className="inline">
			<span className="text-[10px] text-slate-400 font-bold whitespace-pre">{prefix}</span>
			<button 
				onClick={() => onPathClick(branchPoint, path)}
				className={`inline-block text-[11px] rounded px-1 transition-colors hover:bg-black/5 
					${isActive ? 'bg-amber-400 font-bold text-black' : 'text-slate-700'} 
					${isWhite ? 'mr-1' : ''}`}
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
								moveIndex={moveIndex + 1}
							/>
						);
					})}
				</div>
			)}
		</div>
	);
};

export function MoveList({ id, matchHistory: propMatchHistory }: { id: string, matchHistory?: string[] }) {
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

	const scrollToActive = useCallback((node: HTMLDivElement | null) => {
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

	const MoveBtn = ({ text, isActive, onClick } : MoveBtnProps) => (
		<button
			onClick={onClick}
			className={`flex-1 text-sm rounded px-1 text-left whitespace-nowrap transition-colors ${
				isActive ? 'bg-amber-400 font-bold text-black shadow-sm' : 'hover:bg-black/5'
			}`}
		>
			{text}
		</button>
	);
	
	const MoveRow = ({ num, children }: { num: number; children: React.ReactNode }) => (
		<div className="flex items-center gap-2 h-6 group">
			<span className="text-[10px] text-slate-500 w-6 shrink-0">{num}.</span>
			<div className="flex flex-1 gap-1">{children}</div>
		</div>
	);
	
	const VariationBlock = ({ vars, branchPoint, currentPath, activePoint, onPathClick, moveIndex }: VariationBlockProps) => (
		<>
			{vars.map((node: any, idx: number) => (
				<div key={idx} className="flex items-center flex-wrap pl-6 border-l-2 border-amber-200 bg-amber-50/30">
					<MoveNode
						node={node}
						path={[idx]}
						branchPoint={branchPoint}
						currentPath={activePoint === branchPoint ? currentPath : []}
						onPathClick={onPathClick}
						moveIndex={moveIndex}
					/>
				</div>
			))}
		</>
	);

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

		<div className="flex-1 min-h-0 overflow-x-auto overflow-y-hidden mb-4 pr-2">
			<div className="flex flex-col gap-2" 
			style={{
					display: 'flex',
					flexFlow: 'column wrap',
					height: '100%',
					alignContent: 'flex-start',
					overscrollBehaviorX: 'contain',
				}}
			>
				{/* Starting position for variations before the first move */}
				{isAnalysisMode && analysisTree[-1] && (
					analysisTree[-1].map((node, idx) => (
						<div key={idx} className="flex items-center h-7 ml-6">
							<MoveNode 
								node={node} 
								path={[idx]} 
								branchPoint={-1} 
								currentPath={selectedMoveIndex === -1 ? currentPath : []} 
								onPathClick={handlePathClick} 
								moveIndex={0}
							/>
						</div>
					))
				)}

				{pairs.map((pair, i) => {
					const whiteIndex = i * 2;
					const blackIndex = i * 2 + 1;
					const isWhiteActive = currentPath.length === 0 && selectedMoveIndex === whiteIndex;
					const isBlackActive = currentPath.length === 0 && selectedMoveIndex === blackIndex;

					const isPairActive = (selectedMoveIndex === whiteIndex || selectedMoveIndex === blackIndex) && currentPath.length === 0;

					const whiteVars = isAnalysisMode ? analysisTree[whiteIndex] : null;
					const blackVars = isAnalysisMode && pair.black !== "..." ? analysisTree[blackIndex] : null;

					const placeholder = <span className="flex-1 text-sm px-1 text-slate-400">...</span>;

					return (
						<div key={i} className="flex flex-col w-32" ref={isPairActive ? scrollToActive : null}>
							<MoveRow num={pair.num}>
								<MoveBtn 
									text={pair.white} 
									isActive={isWhiteActive} 
									onClick={() => handleMoveClick(whiteIndex)} 
								/>
								{whiteVars ? placeholder : (
									pair.black !== "..." ? 
									<MoveBtn 
										text={pair.black} 
										isActive={isBlackActive} 
										onClick={() => handleMoveClick(blackIndex)} 
									/> : null
								)}
							</MoveRow>
							
							{whiteVars && (
								<>
									<VariationBlock 
										vars={whiteVars} 
										branchPoint={whiteIndex} 
										activePoint={selectedMoveIndex}
										currentPath={currentPath} 
										onPathClick={handlePathClick} 
										moveIndex={whiteIndex}
									/>
									{pair.black !== "..." && (
										<MoveRow num={pair.num}>
											{placeholder}
											<MoveBtn 
												text={pair.black} 
												isActive={isBlackActive} 
												onClick={() => handleMoveClick(blackIndex)} 
											/>
										</MoveRow>
									)}
								</>
							)}

							{/* Варианты черных всегда в конце блока пары */}
							{blackVars && (
								<VariationBlock 
									vars={blackVars} 
									branchPoint={blackIndex} 
									activePoint={selectedMoveIndex}
									currentPath={currentPath} 
									onPathClick={handlePathClick} 
									moveIndex={blackIndex}
								/>
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
