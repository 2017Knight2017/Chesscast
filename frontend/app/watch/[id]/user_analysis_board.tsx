'use client';

import { forwardRef, useImperativeHandle, useState, useMemo, useEffect, useRef } from 'react';
import Chessground from '@bezalel6/react-chessground';
import { Chess } from 'chess.js';
import { MoveTreeNode } from '@/types/types';
import { useAnalysis } from '@/context/analysis_context';

interface UserAnalysisBoardProps {
	matchId: string;
	userId: number|null;
	matchHistory: string[];
	currentFen: string;
	onMove?: (move: string) => void;
}

export interface UserAnalysisBoardRef {
	getCurrentFen: () => string;
}

export const UserAnalysisBoard = forwardRef<UserAnalysisBoardRef, UserAnalysisBoardProps>(
	({ matchId, userId, matchHistory, currentFen, onMove }, ref) => {
		const { 
			analysisTree, 
			addMoveToTree, 
			currentPath, 
			setCurrentPath,
			inspectedUserId,
			syncAnalysisToServer,
			selectedMoveIndex,
			setSelectedMoveIndex
		} = useAnalysis();

		const [fen, setFen] = useState(currentFen);
		const chessRef = useRef(new Chess(currentFen));

		const isReadOnly = inspectedUserId === null;

		useEffect(() => {
			chessRef.current = new Chess(currentFen);
			setFen(currentFen);
		}, [currentFen]);

		useEffect(() => {
			if (selectedMoveIndex !== null && selectedMoveIndex >= 0 && selectedMoveIndex < matchHistory.length) {
				const tempChess = new Chess();
				for (let i = 0; i <= selectedMoveIndex; i++) {
					tempChess.move(matchHistory[i]);
				}
				setFen(tempChess.fen());
				chessRef.current = tempChess;
			} else if (selectedMoveIndex === null) {
				chessRef.current = new Chess(currentFen);
				setFen(currentFen);
			}
		}, [selectedMoveIndex, matchHistory, currentFen]);

		useImperativeHandle(ref, () => ({
			getCurrentFen: () => fen,
		}));

		const getPositionFromTree = (tree: MoveTreeNode[], path: number[]): { fen: string; chess: Chess } => {
			const chess = new Chess();
			let currentLevel = tree;

			for (let i = 0; i < path.length; i++) {
				const idx = path[i];
				if (currentLevel[idx]) {
					chess.move(currentLevel[idx].m);
					if (currentLevel[idx].s) {
						currentLevel = currentLevel[idx].s!;
					}
				}
			}

			return { fen: chess.fen(), chess };
		};

		const computedFen = useMemo(() => {
			if (analysisTree.length === 0) {
				return currentFen;
			}
			const { fen: treeFen } = getPositionFromTree(analysisTree, currentPath);
			return treeFen;
		}, [analysisTree, currentPath, currentFen]);
		
		const handleMove = (orig: string, dest: string) => {
			if (isReadOnly) return;

			const chess = new Chess(computedFen);
			const move = chess.move({ from: orig, to: dest, promotion: 'q' });
			
			if (move) {
				setFen(chess.fen());
				setSelectedMoveIndex(null);
				
				const newPath = [...currentPath];
				const nextIndex = matchHistory.length;
				const expectedMove = matchHistory[nextIndex];

				if (move.san !== expectedMove) {
					const lastNode = analysisTree[newPath.length - 1];
					if (lastNode && lastNode.s) {
						newPath.push(lastNode.s.length);
					}
				} else {
					newPath.push(newPath.length);
				}

				addMoveToTree(move.san, matchHistory, currentPath);
				setCurrentPath(newPath);
				
				if (inspectedUserId) {
					syncAnalysisToServer(matchId, inspectedUserId);
				}

				onMove?.(move.san);
			}
		};

		const calcMovable = () => {
			const chess = new Chess(computedFen);
			const dests = new Map();

			const board = chess.board().flat();

			board.forEach((piece) => {
				if (piece && piece.color === chess.turn()) {
					const moves = chess.moves({ square: piece.square, verbose: true });
					if (moves.length) {
						dests.set(piece.square, moves.map(m => m.to));
					}
				}
			});
			return { free: false,
				showDests: true,
				dests: dests,
				color: (chess.turn() === 'w' ? 'white' : 'black') as 'white'|'black'
			};
		};

		return (
			<div className="w-full h-full flex justify-center items-center">
				<Chessground
					onMove={handleMove}
					fen={computedFen}
					viewOnly={isReadOnly}
					width="100%"
					height="100%"
					coordinates={true}
					movable={calcMovable()}
					animation={{
						enabled: true,
						duration: 300,
					}}
				/>
			</div>
		);
	}
);

UserAnalysisBoard.displayName = 'UserAnalysisBoard';
