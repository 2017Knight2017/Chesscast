"use client";

import { Match } from "@/types/types";
import { ChessPreview } from "./chess_preview";
import { useProcessing } from "@/hooks/use_processing";
import Link from "next/link";
import { useFollowMatch } from "@/hooks/use_follow_match";
import { useAuth } from "@/hooks/use_auth";
import { useRouter } from "next/navigation";
import { useState } from "react";

export const LiveCard = ({
	match,
	viewerCount,
}: {
	match: Match;
	viewerCount?: number;
}) => {
	console.log("[live_card.tsx:LiveCard]", { matchId: match.id, viewerCount });
	const { isProcessing } = useProcessing(match);
	const { isAuthenticated, user, token } = useAuth();
	const router = useRouter();
	const [isDeleting, setIsDeleting] = useState(false);

	const { isFollowing, isLoading, toggleFollow } = useFollowMatch(match.id);

	const handleFollowClick = (e: React.MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();
		toggleFollow();
	};

	const handleDeleteClick = async (e: React.MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();

		if (!confirm("Delete this match?")) return;

		setIsDeleting(true);

		try {
			const API_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "";

			const res = await fetch(`${API_URL}/matches/${match.id}`, {
				method: "DELETE",
				headers: {
					Authorization: `Bearer ${token}`,
				},
			});

			if (!res.ok) {
				throw new Error(`Failed to delete match ${res.status}`);
			}

			router.refresh();
		} catch (error) {
			console.error("Error deleting match:", error);
			alert("Couldn't delete the match");
		} finally {
			setIsDeleting(false);
		}
	};

	const CardWrapper = isProcessing ? "div" : Link;
	const wrapperProps = isProcessing ? {} : { href: `/watch/${match.id}` };

	const isAuthor = isAuthenticated && user?.username === match.author;
	const canDelete = isAuthor && match.status === "waiting";

	return (
		// @ts-expect-error Type error is impossible here
		<CardWrapper {...wrapperProps} className="block">
			<div
				className={`
				bg-[#161512] rounded-md overflow-hidden transition-all
				${isProcessing ? "opacity-80 cursor-not-allowed" : "hover:bg-[#1e1c18] cursor-pointer"}
			`}
			>
				<ChessPreview match={match} isEmbedded={true} />
				<div className="relative p-3">
					<h3
						className={`text-[13px] font-bold truncate transition-colors ${
							isProcessing
								? "text-slate-500"
								: "text-slate-200 group-hover:text-blue-400"
						}`}
					>
						{match.title}
						{isAuthenticated && (
							<button
								onClick={handleFollowClick}
								disabled={isLoading}
								className="absolute top-2 right-7 z-10 p-1 rounded hover:bg-white/10 transition-colors disabled:opacity-50"
								title={
									isFollowing ? "Unfollow match" : "Follow match"
								}
							>
								<svg
									width="16"
									height="16"
									viewBox="0 0 24 24"
									fill={isFollowing ? "#fbbf24" : "none"}
									stroke="#fbbf24"
									strokeWidth="2"
									className="block"
								>
									<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
								</svg>
							</button>
						)}
						{canDelete && (
							<button
								onClick={handleDeleteClick}
								disabled={isDeleting}
								className="absolute top-2 right-1 z-30 p-1 rounded hover:bg-white/10 transition-colors disabled:opacity-50"
								title="Delete match"
							>
								<svg
									width="16"
									height="16"
									viewBox="0 0 24 24"
									fill="none"
									stroke="white"
									strokeWidth="2"
									strokeLinecap="round"
									strokeLinejoin="round"
								>
									<line x1="18" y1="6" x2="6" y2="18" />
									<line x1="6" y1="6" x2="18" y2="18" />
								</svg>
							</button>
						)}
					</h3>
					<div className="flex items-center justify-between mt-1">
						<span className="text-[11px] text-slate-500">
							@{match.author}
						</span>
						<div className="flex items-center gap-1 text-[11px] text-slate-500">
							<span
								className={`w-2 h-2 rounded-full ${isProcessing ? "bg-[#b58863]" : "bg-slate-600"}`}
							></span>
							{isProcessing
								? "WAIT"
								: viewerCount || match.viewerCount}
						</div>
					</div>
				</div>
			</div>
		</CardWrapper>
	);
};
