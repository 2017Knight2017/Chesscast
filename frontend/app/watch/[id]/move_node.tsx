import { MoveTreeNode } from "@/types/types";

interface MoveNodeProps {
	node: MoveTreeNode;
	path: number[];
	branchPoint: number;
	currentPath: number[];
	onPathClick: (branchPoint: number, path: number[]) => void;
	moveIndex: number;
	isFirstInVar?: boolean;
}

const isVerticalBranching = (node: MoveTreeNode) => {
	return node.s && node.s.length > 2;
};

export function MoveNode({
	node,
	path,
	branchPoint,
	currentPath,
	onPathClick,
	moveIndex,
	isFirstInVar = false,
}: MoveNodeProps) {
	const isWhite = moveIndex % 2 === 0;
	const moveNum = Math.floor(moveIndex / 2) + 1;

	const showMoveNum = isWhite || isFirstInVar;

	const numberPrefix = showMoveNum
		? `${moveNum}${isWhite ? "." : "..."} `
		: "";
	const notation = `${numberPrefix}${node.m}`;

	const isActive =
		currentPath.length === path.length &&
		path.every((val, i) => val === currentPath[i]);
	const isVertical = isVerticalBranching(node);

	return (
		<div className={isVertical ? "flex flex-col w-full" : "inline"}>
			<div
				className={
					isVertical ? "flex items-center h-8 lg:h-7" : "inline"
				}
			>
				<button
					onClick={() => onPathClick(branchPoint, path)}
					className={`inline-block text-[11px] rounded px-2 py-1 lg:px-1 lg:py-0 transition-colors hover:bg-black/5
						${isActive ? "bg-amber-400 font-bold text-black" : "text-slate-700"}
						${!isWhite && !isVertical ? "mr-1" : ""}`}
				>
					{notation}
				</button>
			</div>

			{node.s &&
				node.s.length > 0 &&
				(isVertical ? (
					<div className="flex flex-col ml-3 pl-2 border-l-2 border-black/10">
						{node.s.map((childNode, childIdx) => (
							<div
								key={childIdx}
								className="flex items-center flex-wrap"
							>
								<MoveNode
									node={childNode}
									path={[...path, childIdx]}
									branchPoint={branchPoint}
									currentPath={currentPath}
									onPathClick={onPathClick}
									moveIndex={moveIndex + 1}
									isFirstInVar={childIdx > 0}
								/>
							</div>
						))}
					</div>
				) : (
					<span className="inline">
						{node.s.map((childNode, childIdx) => {
							const childPath = [...path, childIdx];

							if (childIdx === 0) {
								return (
									<span key={childIdx} className="inline">
										<MoveNode
											node={childNode}
											path={childPath}
											branchPoint={branchPoint}
											currentPath={currentPath}
											onPathClick={onPathClick}
											moveIndex={moveIndex + 1}
											isFirstInVar={false}
										/>
									</span>
								);
							} else {
								return (
									<span
										key={childIdx}
										className="text-slate-500 italic mr-1"
									>
										(
										<MoveNode
											node={childNode}
											path={childPath}
											branchPoint={branchPoint}
											currentPath={currentPath}
											onPathClick={onPathClick}
											moveIndex={moveIndex + 1}
											isFirstInVar={true}
										/>
										)
									</span>
								);
							}
						})}
					</span>
				))}
		</div>
	);
};