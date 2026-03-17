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

		const isReadOnly = inspectedUserId !== null;

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

		const computedChess = useMemo(() => {
			const chess = new Chess();

			if (currentPath.length > 0 && analysisTree.length > 0) {
				let currentLevel = analysisTree;
				for (const idx of currentPath) {
					if (currentLevel && currentLevel[idx]) {
						try {
							chess.move(currentLevel[idx].m);
							currentLevel = currentLevel[idx].s || [];
						} catch (e) {
							break; 
						}
					} else {
						break;
					}
				}
			} else if (selectedMoveIndex !== null) {
				if (selectedMoveIndex == -1) return chess;
				for (let i = 0; i <= selectedMoveIndex; i++) {
					if (matchHistory[i]) {
						chess.move(matchHistory[i]);
					}
				}
			} else {
				for (const m of matchHistory) {
					chess.move(m);
				}
				if (chess.fen() !== currentFen) {
					chess.load(currentFen);
				}
			}
			
			return chess;
		}, [analysisTree, currentPath, selectedMoveIndex, matchHistory, currentFen]);

		const computedFen = computedChess.fen();

		useImperativeHandle(ref, () => ({
			getCurrentFen: () => computedFen,
		}));
		
		const handleMove = (orig: string, dest: string) => {
			if (isReadOnly) return;

			const chess = new Chess(computedFen);
			const move = chess.move({ from: orig, to: dest, promotion: 'q' });

			if (move) {
				if (currentPath.length === 0) {
					const targetIndex = selectedMoveIndex !== null ? selectedMoveIndex : matchHistory.length - 1;
					const historyPath = Array.from({ length: targetIndex + 1 }, () => 0);

					addMoveToTree(move.san, matchHistory, historyPath);
					setCurrentPath([...historyPath, 0]);
				} else {
					addMoveToTree(move.san, matchHistory, currentPath);
					setCurrentPath(prev => [...prev, 0]);
				}
			
				setSelectedMoveIndex(null);
				if (userId) syncAnalysisToServer(matchId, userId);
				onMove?.(move.san);
			}
		};

		const movableObj = useMemo(() => {
			const dests = new Map();
			const board = computedChess.board().flat();

			board.forEach((piece) => {
				if (piece && piece.color === computedChess.turn()) {
					const moves = computedChess.moves({ square: piece.square, verbose: true });
					if (moves.length) {
						dests.set(piece.square, moves.map(m => m.to));
					}
				}
			});

			return {
				free: false,
				showDests: true,
				dests: dests,
				color: "both" as const
			};
		}, [computedChess]);

		return (
			<div className="w-full h-full rounded-md overflow-hidden flex justify-center items-center">
				<Chessground
					onMove={handleMove}
					fen={computedFen}
					viewOnly={isReadOnly}
					width="100%"
					height="100%"
					coordinates={true}
					movable={movableObj}
					premovable={{ enabled: false }}
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
