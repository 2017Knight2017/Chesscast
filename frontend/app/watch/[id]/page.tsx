import WatchMatchClient from './watch_match_client';
import { Match } from '@/types/types';

export default async function WatchPage({ params }: { params: Promise<{ id: string }> }) {
    const matchId = (await params).id;

    const res = await fetch(`${process.env.NEST_API_URL}/matches/${matchId}/state`, {
        headers: { 'Content-Type': 'application/json' }
    });

    if (!res.ok) {
        return <div className="p-10 text-center">Match not found or failed to load.</div>;
    }

    const initialMatchData: Match = await res.json();
    
    return (
		<WatchMatchClient matchId={matchId} initialMatch={initialMatchData} />
	);
}
























//import { useState, useEffect, useRef, useCallback } from 'react';
//import { ChessBoard } from '@/components/chess_board';
//import { UserAnalysisBoard, UserAnalysisBoardRef } from '@/components/user_analysis_board';
//import { MoveList } from '@/components/move_list';
//import { SpectatorList } from '@/components/spectator_list';
//import { AnalysisPrompt, SavePrompt } from '@/components/analysis_prompts';
//import { Match } from '@/types/types';
//import { useBroadcast } from '@/hooks/use_broadcast';
//import { useAnalysis } from '@/context/analysis_context';
//import { io, Socket } from 'socket.io-client';
//import { useGuestId } from '@/hooks/use_guest_id';
//
//export default async function WatchPage({ params }: { params: Promise<{ id: string }> }) {
//	const matchId = (await params).id;
//	const { currentMoveData, isEnded } = useBroadcast(matchId);
//	const {
//		isAnalysisMode,
//		inspectedUserId,
//		setAnalysisMode,
//		setInspectedUserId,
//		setMatchId,
//		setAnalysisTree,
//		analysisTree,
//		saveAnalysis,
//		discardAnalysis,
//		checkExistingAnalysis,
//		loadAnalysis,
//		syncAnalysisToServer,
//	} = useAnalysis();
//
//	const [showBeginPrompt, setShowBeginPrompt] = useState(false);
//	const [showSavePrompt, setShowSavePrompt] = useState(false);
//	const [hasExistingAnalysis, setHasExistingAnalysis] = useState(false);
//	const [match, setMatch] = useState<Match | null>(null);
//	const [userId, setUserId] = useState<number | null>(null);
//
//	const userAnalysisBoardRef = useRef<UserAnalysisBoardRef>(null);
//	const guestId = useGuestId();
//	const socketRef = useRef<Socket | null>(null);
//
//	useEffect(() => {
//		const fetchMatch = async () => {
//			const res = await fetch(`${process.env.NEST_API_URL}/matches/${matchId}/state`);
//			if (res.ok) {
//				const data: Match = await res.json();
//				setMatch(data);
//			}
//		};
//		fetchMatch();
//	}, [matchId]);
//
//	useEffect(() => {
//		const user = localStorage.getItem('user');
//		if (user) {
//			const parsed = JSON.parse(user);
//			setUserId(parsed.id);
//		}
//	}, []);
//
//	useEffect(() => {
//		if (matchId && userId) {
//			setMatchId(matchId);
//			checkExistingAnalysis(matchId, userId).then(setHasExistingAnalysis);
//		}
//	}, [matchId, userId, checkExistingAnalysis, setMatchId]);
//
//	useEffect(() => {
//		socketRef.current = io(process.env.NEXT_PUBLIC_SOCKET_URL, {
//			transports: ['websocket'],
//		});
//
//		socketRef.current.on('analysisUpdate', (data: { movesTree: any }) => {
//			if (inspectedUserId && data.movesTree) {
//				setAnalysisTree(data.movesTree);
//			}
//		});
//
//		return () => {
//			if (socketRef.current) {
//				socketRef.current.disconnect();
//			}
//		};
//	}, [inspectedUserId, setAnalysisTree]);
//
//	const handleMoveOnMainBoard = useCallback(() => {
//		if (!isAnalysisMode && !showBeginPrompt && match && userId) {
//			setShowBeginPrompt(true);
//		}
//	}, [isAnalysisMode, showBeginPrompt, match, userId]);
//
//	const handleBeginAnalysis = async () => {
//		setShowBeginPrompt(false);
//		setAnalysisMode(true);
//		setInspectedUserId(userId);
//
//		if (hasExistingAnalysis && matchId && userId) {
//			await loadAnalysis(matchId, userId);
//		}
//
//		socketRef.current?.emit('joinAnalysisStream', { matchId, userId });
//	};
//
//	const handleSave = async () => {
//		setShowSavePrompt(false);
//		if (matchId && userId) {
//			await saveAnalysis(matchId, userId);
//			socketRef.current?.emit('leaveAnalysisStream', { matchId, userId });
//		}
//	};
//
//	const handleDiscard = async () => {
//		setShowSavePrompt(false);
//		if (matchId && userId) {
//			await discardAnalysis(matchId, userId);
//			socketRef.current?.emit('leaveAnalysisStream', { matchId, userId });
//		}
//	};
//
//	const handleInspectUser = async (username: string) => {
//		const res = await fetch(`${process.env.NEST_API_URL}/players/by-username/${username}`);
//		if (!res.ok) return;
//		const playerData = await res.json();
//		
//		setInspectedUserId(playerData.userId);
//		setAnalysisMode(true);
//		
//		await loadAnalysis(matchId, playerData.userId);
//
//		socketRef.current?.emit('joinAnalysisStream', { matchId, userId: playerData.userId });
//	};
//
//	const handleMainBoardClick = () => {
//		if (isAnalysisMode && inspectedUserId === userId) {
//			setShowSavePrompt(true);
//		}
//	};
//
//	if (!match || !currentMoveData) {
//		return <div>Loading...</div>;
//	}
//
//	return (
//		<main className="h-screen w-screen bg-size-[100%_100%] overflow-hidden">
//			{showBeginPrompt && (
//				<AnalysisPrompt
//					isBegin={!hasExistingAnalysis}
//					onYes={handleBeginAnalysis}
//					onNo={() => setShowBeginPrompt(false)}
//				/>
//			)}
//
//			{showSavePrompt && (
//				<SavePrompt
//					onSave={handleSave}
//					onDiscard={handleDiscard}
//					onCancel={() => setShowSavePrompt(false)}
//				/>
//			)}
//
//			<div 
//				className={`grid size-full items-center px-10 gap-0 relative z-10 ${
//					isAnalysisMode ? 'grid-cols-[300px_1fr_300px]' : 'grid-cols-[300px_1fr_300px]'
//				}`}
//			>
//				<aside className="h-[75vh] flex flex-col justify-center">
//					<div className="bg-[#f4ead5]/20 backdrop-blur-sm p-4 h-full border border-[#8b5e34]/20 shadow-lg">
//						<SpectatorList id={match.id} onInspectUser={handleInspectUser} />
//					</div>
//				</aside>
//
//				<section 
//					className={`flex justify-center items-center ${
//						isAnalysisMode ? 'order-first' : ''
//					}`}
//				>
//					<div 
//						className={`w-full shadow-2xl flex items-center justify-center ${
//							isAnalysisMode ? 'max-w-[40vh] aspect-square' : 'max-w-[70vh] aspect-square'
//						}`}
//						onClick={handleMainBoardClick}
//					>
//						<ChessBoard 
//							match={match} 
//							compact={isAnalysisMode}
//						/>
//					</div>
//				</section>
//
//				{isAnalysisMode && (
//					<section className="flex justify-center items-center">
//						<div className="w-full max-w-[70vh] aspect-square shadow-2xl flex items-center justify-center">
//							<UserAnalysisBoard
//								ref={userAnalysisBoardRef}
//								matchId={matchId}
//								matchHistory={currentMoveData.history}
//								currentFen={currentMoveData.fen}
//							/>
//						</div>
//					</section>
//				)}
//
//				<aside className="h-[75vh] flex flex-col justify-center">
//					<div className="bg-[#f4ead5]/20 backdrop-blur-sm p-4 h-full border border-[#8b5e34]/20 shadow-lg">
//						<MoveList id={match.id} />
//					</div>
//				</aside>
//			</div>
//		</main>
//	);
//}