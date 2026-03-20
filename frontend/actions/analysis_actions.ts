"use server";

export async function saveAnalysisAction(matchId: string, analysisTree: any, token: string | null) {
	const res = await fetch(`${process.env.NEST_API_URL}/user-analysis/save`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			...(token ? { Authorization: `Bearer ${token}` } : {}),
		},
		body: JSON.stringify({ matchId, data: analysisTree }),
	});

	if (!res.ok) throw new Error('Failed to save analysis');
	return res.json();
}

export async function discardAnalysisAction(matchId: string, token: string | null) {
	const res = await fetch(`${process.env.NEST_API_URL}/user-analysis/discard`, {
		method: 'DELETE',
		headers: {
			'Content-Type': 'application/json',
			...(token ? { Authorization: `Bearer ${token}` } : {}),
		},
		body: JSON.stringify({ matchId }),
	});

	if (!res.ok) throw new Error('Failed to discard analysis');
	return res.json();
}

export async function checkExistingAnalysisAction(matchId: string, userId: number) {
	const res = await fetch(`${process.env.NEST_API_URL}/user-analysis/is-analyzing/${matchId}/${userId}`);
		
	if (!res.ok) throw new Error('Failed to check existing analysis');
	const data = await res.json();
	return data.isAnalyzing;
}

export async function loadAnalysisAction(matchId: string, userId: number) {
	const res = await fetch(`${process.env.NEST_API_URL}/user-analysis/${matchId}/${userId}`);
		
	if (!res.ok) throw new Error('Failed to load analysis');
	return res.json();
}

export async function getPlayerByUsernameAction(username: string) {
	try {
		const res = await fetch(`${process.env.NEST_API_URL}/players/by-username/${username}`, {
			cache: 'no-store'
		});

		if (!res.ok) {
			return { success: false, error: 'Player not found' };
		}

		const playerData = await res.json();
		return { success: true, data: playerData };
	} catch (error) {
		console.error("Action Error:", error);
		return { success: false, error: 'Internal server error' };
	}
}