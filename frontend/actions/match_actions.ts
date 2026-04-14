"use server";

import { CreateMatchData } from "@/types/types";
import { cookies } from "next/headers";

export interface StartMatchResponse {
	success: boolean;
	message: string;
	isLimitError?: boolean;
}

export async function createMatchAction({
	pgn,
	archetypes,
	whitePlayer,
	blackPlayer,
	title,
	timeControlNum,
	isControlMove,
	isRepeatableControlMove,
	controlMove,
	timeIncrement,
	bonusTimeMin,
	nextControlMoveAfter,
	newTimeIncrement,
	scheduledAt,
}: CreateMatchData): Promise<StartMatchResponse> {
	const cookieStore = await cookies();
	const token = cookieStore.get("token")?.value;

	if (!token) {
		return { success: false, message: "Authorization is required" };
	}

	try {
		let queryBody: string;
		if (isRepeatableControlMove) {
			queryBody = JSON.stringify({
				pgn: pgn,
				archetypes: archetypes,
				whitePlayer: whitePlayer,
				blackPlayer: blackPlayer,
				title: title,
				timeControl: timeControlNum,
				controlMove: controlMove,
				timeIncrement: timeIncrement,
				bonusTimeMin: bonusTimeMin,
				nextControlMoveAfter: nextControlMoveAfter,
				newTimeIncrement: newTimeIncrement,
				scheduledAt: scheduledAt,
			});
		} else if (isControlMove) {
			queryBody = JSON.stringify({
				pgn: pgn,
				archetypes: archetypes,
				whitePlayer: whitePlayer,
				blackPlayer: blackPlayer,
				title: title,
				timeControl: timeControlNum,
				controlMove: controlMove,
				timeIncrement: timeIncrement,
				bonusTimeMin: bonusTimeMin,
				newTimeIncrement: newTimeIncrement,
				scheduledAt: scheduledAt,
			});
		} else {
			queryBody = JSON.stringify({
				pgn: pgn,
				archetypes: archetypes,
				whitePlayer: whitePlayer,
				blackPlayer: blackPlayer,
				title: title,
				timeControl: timeControlNum,
				timeIncrement: timeIncrement,
				scheduledAt: scheduledAt,
			});
		}

		console.log("[new/match_actions.tsx:CreateMatchAction]", queryBody)

		const res = await fetch(`${process.env.NEST_API_URL}/matches/create`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${token}`,
			},
			body: queryBody,
			cache: "no-store",
		});

		if (!res.ok) {
			const errorData = await res.json();
			const message = errorData.message || "Error on creating a broadcast";
			// Check if the error is about the active matches limit
			if (message.toLowerCase().includes("limit")) {
				return {
					success: false,
					message,
					isLimitError: true,
				};
			}
			return {
				success: false,
				message,
			};
		}

		return { success: true, message: "Broadcast is created!" };
	} catch (error) {
		console.error("API connection error:", error);
		return { success: false, message: "Couldn't connect to server" };
	}
}

export async function launchMatchAction(matchId: string) {
	console.log("[match_actions.ts:launchMatchAction]", { matchId });
	await fetch(`${process.env.NEST_API_URL}/matches/${matchId}/start`, {
		method: "POST",
	});
}
