"use client";

import { useState, useEffect, useRef } from 'react';
import { ChessBoard } from '@/app/watch/[id]/chess_board';
import { UserAnalysisBoard, UserAnalysisBoardRef } from '@/app/watch/[id]/user_analysis_board';
import { MoveList } from '@/app/watch/[id]/move_list';
import { SpectatorList } from '@/app/watch/[id]/spectator_list';
import { Match } from '@/types/types';
import { useBroadcast } from '@/hooks/use_broadcast';
import { useAnalysisState } from '@/context/analysis_context';
import { useAnalysisSync } from '@/hooks/use_analysis_sync';
import { MobileBottomPanel } from '@/app/watch/[id]/mobile_bottom_panel';

export default function WatchMatchClient({ match }: {match: Match}) {
	console.log("[watch/[id]/watch_match_client.tsx:WatchMatchClient]", { matchId: match.id });
	const { currentMoveData, isEnded, outcome } = useBroadcast(match.id, match);
	const {
		isAnalysisMode,
		setMatchId,
		checkExistingAnalysis,
	} = useAnalysisState();

	const [hasExistingAnalysis, setHasExistingAnalysis] = useState(false);
	const [userId, setUserId] = useState<number | null>(null);
	const {
		handleInteractionOnMainBoard,
		handleMainBoardClick,
		handleInspectUser
	} = useAnalysisSync({ 
		match, 
		userId, 
		hasExistingAnalysis 
	});

	const [isManualStarted, setIsManualStarted] = useState<boolean>(false);
	const isBroadcastActive = match.status === "in_progress" || isManualStarted;
	const finalIsEnded = match.status === "finished" || isEnded;

	const userAnalysisBoardRef = useRef<UserAnalysisBoardRef>(null); 

	useEffect(() => {
		const user = localStorage.getItem('user');
		if (user) {
			const parsed = JSON.parse(user);
			setUserId(parsed.id);
		}
	}, []);

	useEffect(() => {
		if (match.id && userId) {
			setMatchId(match.id);
			checkExistingAnalysis(match.id, userId).then(setHasExistingAnalysis);
		}
	}, [match.id, userId]);

	if (!currentMoveData) {
		return <div>Loading match data...</div>;
	}

	return (
		<main className="h-screen w-screen bg-size-[100%_100%] overflow-x-hidden overflow-y-auto lg:overflow-hidden bg-[#1a0f07]">
			{/* Desktop Layout */}
			<div className='hidden lg:grid size-full items-center px-10 gap-8 relative z-10 grid-cols-[300px_1fr_300px]'>
				<aside className="h-[75vh] flex flex-col"> 
					<div className="bg-[#f4ead5]/20 backdrop-blur-sm p-4 flex-1 min-h-0 border border-[#8b5e34]/20 shadow-lg overflow-hidden">
						<SpectatorList id={match.id} onInspectUser={handleInspectUser} />
					</div>

					{isAnalysisMode && (
						<div className='w-full p-6 shrink-0 flex items-center justify-center max-w-[40vh] aspect-square'>
							<ChessBoard 
								onSelect={async () => {
									const exists = await handleMainBoardClick();
									setHasExistingAnalysis(exists);
								}}
								setIsManualStarted={setIsManualStarted}
								isManualStarted={isManualStarted}
								match={match}
								currentMoveData={currentMoveData}
								isBroadcastActive={isBroadcastActive}
								finalIsEnded={finalIsEnded}
								outcome={outcome}
							/>
						</div>
					)}
				</aside>

				<section className='flex justify-center items-center flex-col gap-4'>
					{!isAnalysisMode && (
						<div className='w-full shadow-2xl flex items-center justify-center max-w-[70vh] aspect-square'>
							<ChessBoard 
								onMove={() => handleInteractionOnMainBoard("move")}
								onSelect={() => handleInteractionOnMainBoard("select")}
								setIsManualStarted={setIsManualStarted}
								isManualStarted={isManualStarted}
								match={match} 
								currentMoveData={currentMoveData}
								isBroadcastActive={isBroadcastActive}
								finalIsEnded={finalIsEnded}
								outcome={outcome}
							/>
						</div>
					)}

					{isAnalysisMode && (
						<div className="w-full max-w-[70vh] aspect-square shadow-2xl flex items-center justify-center">
							<UserAnalysisBoard
								ref={userAnalysisBoardRef}
								matchId={match.id}
								userId={userId}
								matchHistory={currentMoveData.history}
								currentFen={currentMoveData.fen}
							/>
						</div>
					)}
				</section>

				<aside className="h-[75vh] flex flex-col justify-center">
					<div className="bg-[#f4ead5]/20 backdrop-blur-sm p-4 h-full border border-[#8b5e34]/20 shadow-lg">
						<MoveList id={match.id} />
					</div>
				</aside>
			</div>

			{/* Mobile Layout */}
			<div className="lg:hidden flex flex-col min-h-screen pt-[10%] relative z-10">
				<section className="flex flex-col items-center px-4 py-8 gap-12">
					{!isAnalysisMode ? (
						<div className="w-full max-w-[500px] aspect-square shadow-2xl relative">
							<ChessBoard 
								onMove={() => handleInteractionOnMainBoard("move")}
								onSelect={() => handleInteractionOnMainBoard("select")}
								setIsManualStarted={setIsManualStarted}
								isManualStarted={isManualStarted}
								match={match} 
								currentMoveData={currentMoveData}
								isBroadcastActive={isBroadcastActive}
								finalIsEnded={finalIsEnded}
								outcome={outcome}
							/>
						</div>
					) : (
						<div className="w-full max-w-[500px] aspect-square shadow-2xl relative">
							<UserAnalysisBoard
								ref={userAnalysisBoardRef}
								matchId={match.id}
								userId={userId}
								matchHistory={currentMoveData.history}
								currentFen={currentMoveData.fen}
							/>
							{/* Mini board for Analysis Mode on Mobile */}
							<div className="fixed bottom-4 right-4 w-32 h-32 z-50 shadow-2xl border-2 border-[#8b5e34] bg-[#1a0f07] rounded-md overflow-hidden">
								<ChessBoard 
									onSelect={async () => {
										const exists = await handleMainBoardClick();
										setHasExistingAnalysis(exists);
									}}
									setIsManualStarted={setIsManualStarted}
									isManualStarted={isManualStarted}
									match={match}
									currentMoveData={currentMoveData}
									isBroadcastActive={isBroadcastActive}
									finalIsEnded={finalIsEnded}
									outcome={outcome}
									hideTimers={true}
								/>
							</div>
						</div>
					)}
				</section>

				<div className="mt-auto">
					<MobileBottomPanel 
						matchId={match.id} 
						onInspectUser={handleInspectUser} 
					/>
				</div>
			</div>
		</main>
	);
}
