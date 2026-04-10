"use client";

import { Move, MoveRecord, MoveTreeNode } from "@/types/types";
import { useCallback, useEffect, useMemo, useRef, memo } from "react";
import { BackToLiveButton } from "./back_to_live_button";
import { useAnalysisState } from "@/context/analysis_context";
import { MoveNode } from "./move_node";

const EMPTY_ARRAY: number[] = [];

interface VariationBlockProps {
	vars: MoveTreeNode[];
	branchPoint: number;
	currentPath: number[];
	moveIndex: number;
	onPathClick: (branchPoint: number, path: number[]) => void;
}

interface MoveBtnProps {
	text: string;
	isActive: boolean;
	onClick: () => void;
}

interface MoveListProps {
	matchHistory?: string[];
	currentMoveData: Move | null;
	finalIsEnded: boolean;
}

const MoveBtn = memo(({ text, isActive, onClick }: MoveBtnProps) => (
	<button
		onClick={onClick}
		className={`flex-1 text-sm rounded px-2 py-1.5 lg:px-1 lg:py-0 text-left whitespace-nowrap transition-colors ${
			isActive
				? "bg-amber-400 font-bold text-black shadow-sm"
				: "hover:bg-black/5"
		}`}
	>
		{text}
	</button>
));
MoveBtn.displayName = "MoveBtn";

const MoveRow = memo(({ num, children }: { num: number; children: React.ReactNode }) => (
	<div className="flex items-center gap-2 h-8 lg:h-6 group">
		<span className="text-[10px] text-slate-500 w-6 shrink-0">{num}.</span>
		<div className="flex flex-1 gap-1">{children}</div>
	</div>
));
MoveRow.displayName = "MoveRow";

const VariationBlock = memo(({ vars, branchPoint, currentPath, onPathClick, moveIndex }: VariationBlockProps) => (
	<>
		{vars.map((node: MoveTreeNode, idx: number) => (
			<div
				key={idx}
				className="flex items-center flex-wrap pl-2 ml-4 pb-2 border-l-2 border-amber-300 bg-amber-50/30 rounded-r"
			>
				<MoveNode
					node={node}
					path={[idx]}
					branchPoint={branchPoint}
					currentPath={currentPath}
					onPathClick={onPathClick}
					moveIndex={moveIndex + 1}
					isFirstInVar={true}
				/>
			</div>
		))}
	</>
));
VariationBlock.displayName = "VariationBlock";

// 2. НОВЫЙ КОМПОНЕНТ: Мемоизированная пара ходов
interface MovePairItemProps {
	pair: MoveRecord;
	whiteIndex: number;
	blackIndex: number;
	isWhiteActive: boolean;
	isBlackActive: boolean;
	isPairActive: boolean;
	whiteVars: MoveTreeNode[] | null;
	blackVars: MoveTreeNode[] | null;
	activeWhitePath: number[];
	activeBlackPath: number[];
	handleMoveClick: (index: number) => void;
	handlePathClick: (branchPoint: number, path: number[]) => void;
	scrollToActive: (node: HTMLDivElement | null) => void;
}

const MovePairItem = memo(function MovePairItem({
	pair, whiteIndex, blackIndex, isWhiteActive, isBlackActive, isPairActive,
	whiteVars, blackVars, activeWhitePath, activeBlackPath, handleMoveClick, handlePathClick, scrollToActive
}: MovePairItemProps) {
	
	const onWhiteClick = useCallback(() => handleMoveClick(whiteIndex), [handleMoveClick, whiteIndex]);
	const onBlackClick = useCallback(() => handleMoveClick(blackIndex), [handleMoveClick, blackIndex]);

	const placeholder = <span className="flex-1 text-sm px-1 text-slate-400">...</span>;

	return (
		<div
			className="flex flex-col w-52"
			ref={isPairActive ? scrollToActive : null}
		>
			<MoveRow num={pair.num}>
				<MoveBtn text={pair.white} isActive={isWhiteActive} onClick={onWhiteClick} />
				{whiteVars ? (
					placeholder
				) : pair.black !== "..." ? (
					<MoveBtn text={pair.black} isActive={isBlackActive} onClick={onBlackClick} />
				) : null}
			</MoveRow>

			{whiteVars && (
				<>
					<VariationBlock
						vars={whiteVars}
						branchPoint={whiteIndex}
						currentPath={activeWhitePath}
						onPathClick={handlePathClick}
						moveIndex={whiteIndex}
					/>
					{pair.black !== "..." && (
						<MoveRow num={pair.num}>
							{placeholder}
							<MoveBtn text={pair.black} isActive={isBlackActive} onClick={onBlackClick} />
						</MoveRow>
					)}
				</>
			)}

			{blackVars && (
				<VariationBlock
					vars={blackVars}
					branchPoint={blackIndex}
					currentPath={activeBlackPath}
					onPathClick={handlePathClick}
					moveIndex={blackIndex}
				/>
			)}
		</div>
	);
});

export function MoveList({ matchHistory: propMatchHistory, currentMoveData, finalIsEnded }: MoveListProps) {
	const {
		isAnalysisMode,
		analysisTree,
		currentPath,
		setCurrentPath,
		selectedMoveIndex,
		setSelectedMoveIndex,
		deleteBranch,
		inspectedUserId,
	} = useAnalysisState();

	const socketHistory = currentMoveData?.history || [];
	const matchHistory = propMatchHistory || socketHistory;
	const activeRef = useRef<HTMLDivElement | null>(null);

	useEffect(() => {
		let rafId: number;
		if (activeRef.current) {
			rafId = requestAnimationFrame(() => {
				activeRef.current?.scrollIntoView({
					behavior: "smooth",
					block: "nearest",
					inline: "center",
				});
			});
		}
		return () => {
			if (rafId) cancelAnimationFrame(rafId);
		};
	}, [selectedMoveIndex, currentPath]);

	const handleMoveClick = useCallback(
		(moveIndex: number) => {
			setCurrentPath([]);
			setSelectedMoveIndex(moveIndex);
		}, [setCurrentPath, setSelectedMoveIndex]);

	const handlePathClick = useCallback(
		(branchPoint: number, path: number[]) => {
			setSelectedMoveIndex(branchPoint);
			setCurrentPath(path);
		}, [setCurrentPath, setSelectedMoveIndex]);

	const scrollToActive = useCallback((node: HTMLDivElement | null) => {
		if (node) {
			activeRef.current = node; 
			node.scrollIntoView({
				behavior: "smooth",
				block: "nearest",
				inline: "center",
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
		<div className="h-full flex flex-col p-4 border-l-4 border-oak bg-orange-50 shadow-inner overflow-hidden font-mono text-stone-900">
			<div className="shrink-0 flex justify-between items-center border-b mb-2 pb-1">
				<h3>Moves Record</h3>
				{isAnalysisMode &&
					currentPath.length > 0 &&
					selectedMoveIndex !== null &&
					inspectedUserId === null && (
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
				<div
					className="h-full flex flex-col content-start gap-2 flex-wrap"
					style={{ overscrollBehaviorX: "contain" }}
				>
					{/* Starting position variations */}
					{isAnalysisMode &&
						analysisTree[-1] &&
						analysisTree[-1].map((node, idx) => (
							<div
								key={idx}
								className="flex items-center h-7 pl-2 ml-4 border-l-2 border-amber-300 bg-amber-50/30 rounded-r"
							>
								<MoveNode
									node={node}
									path={[idx]}
									branchPoint={-1}
									currentPath={selectedMoveIndex === -1 ? currentPath : EMPTY_ARRAY}
									onPathClick={handlePathClick}
									moveIndex={0}
								/>
							</div>
						))}

					{/* 4. ЧИСТЫЙ РЕНДЕР: Вычисляем пропсы и передаем в мемоизированный компонент */}
					{pairs.map((pair, i) => {
						const whiteIndex = i * 2;
						const blackIndex = i * 2 + 1;

						const isWhiteActive = currentPath.length === 0 && selectedMoveIndex === whiteIndex;
						const isBlackActive = currentPath.length === 0 && selectedMoveIndex === blackIndex;
						const isPairActive = isWhiteActive || isBlackActive;

						const whiteVars = isAnalysisMode ? analysisTree[whiteIndex] : null;
						const blackVars = isAnalysisMode && pair.black !== "..." ? analysisTree[blackIndex] : null;

						// Тот самый трюк со ссылками: если ход не активен, мы передаем стабильный EMPTY_ARRAY
						const activeWhitePath = selectedMoveIndex === whiteIndex ? currentPath : EMPTY_ARRAY;
						const activeBlackPath = selectedMoveIndex === blackIndex ? currentPath : EMPTY_ARRAY;

						return (
							<MovePairItem
								key={i}
								pair={pair}
								whiteIndex={whiteIndex}
								blackIndex={blackIndex}
								isWhiteActive={isWhiteActive}
								isBlackActive={isBlackActive}
								isPairActive={isPairActive}
								whiteVars={whiteVars}
								blackVars={blackVars}
								activeWhitePath={activeWhitePath}
								activeBlackPath={activeBlackPath}
								handleMoveClick={handleMoveClick}
								handlePathClick={handlePathClick}
								scrollToActive={scrollToActive}
							/>
						);
					})}
				</div>
			</div>

			{!finalIsEnded && (
				<div className="shrink-0 mt-auto pt-4 border-t border-black/5">
					<BackToLiveButton />
				</div>
			)}
		</div>
	);
}