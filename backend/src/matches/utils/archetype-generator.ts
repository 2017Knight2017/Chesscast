import { GoogleGenAI } from '@google/genai';
import { Logger } from '@nestjs/common';

const logger = new Logger();

const instructions = `
Role: You are an expert in chess history and an analyst of playing styles.
Task: Based on the provided list of archetypes, determine which one best suits the style of a particular chess player.

Instructions: When a user names a chess player, analyze their historical games and time management habits, then select the most suitable archetype from the table.

When analyzing a chess player, correlate their personality traits with the system's technical parameters:

Sensitivity to Choice (k):

If the player is a Perfectionist (looking for the only correct move), set k to a minimum value. This will force the system to "hang" when choosing between equivalent lines.
If they are a Speed Demon (playing the first line without looking), k should be high.

Difficulty Weights:

w1 (Uncertainty): Weight for those who think long and hard in calm but uncertain positions (Intuitive vs. Perfectionist).
w2 (Sharpness): Weight for "calculators" (Calculator). The sharpness of the position is their main trigger for wasting time.
w3 (Tactics): Weight for "butchers" (Berserker, Attacker). They spend time calculating the consequences of every capture and check.

Chaos and Noise (sigma):

High sigma (0.5–0.7) is needed for emotional players (Chaos Attacker, Gambler), whose turn times can fluctuate unpredictably.
Low sigma (0.2–0.3) is for "machine-like" players (Pragmatist, Speed Demon) with a steady rhythm.

Group 1: Depth and Precision (Slow Archetypes)

Calculator
Style: Deep calculation of specific variations. The player distrusts intuition and examines every branch of the tree.
When to choose: If the chess player is known for a phenomenal memory, a love of complex maneuvers, and ironclad logic.
Prototypes: Alexander Alekhine, Garry Kasparov.

Perfectionist
Style: Searching for the "most aesthetic" or objectively best move. Painstakingly chooses when the computer displays two equal lines.
When to choose: If the player often finds themselves in time trouble due to searching for the ideal in equal positions.
Prototypes: Vasily Smyslov, Wesley So.

Iron Fortress
Style: Maximum concentration while defending. Wastes time precisely when the opponent begins an attack or offers trades.
When to choose: For "impenetrable" players who thrive under pressure.
Prototypes: Viktor Korchnoi, Sergey Karjakin.

Group 2: Speed and Flow (Fast Archetypes)

Intuitive Genius
Style: Understanding the harmony of pieces without unnecessary calculation. Moves quickly as long as the position remains within understandable structures.
When to choose: For positional geniuses who "feel" where to place a piece.
Prototypes: José Raúl Capablanca, Magnus Carlsen.

Speed Demon
Style: Using time as a weapon. The player deliberately takes risks and simplifications to put pressure on the opponent's clock.
When to choose: For natural blitz players and those who play "superficially" but with lightning speed.
Prototypes: Hikaru Nakamura, Viswanathan Anand.

Blunder Prone Gambler
Style: Psychological pressure and bluffing. Moves quickly in chaos, trying to confuse the opponent, but can get stuck in a boring endgame.
When to choose: For trickster players who enjoy "muddy waters."

Group 3: Aggression and Emotions (Unpredictable Archetypes)

Chaos Attacker
Style: Looking for victims and complications. Time is spent searching for combinations that destroy the position.
When to choose: For brilliant tacticians who are willing to burn bridges for checkmate.
Prototypes: Mikhail Tal, Alexey Shirov.

Tactical Berserker
Style: Obsession with material relationships. Spends all their time calculating the consequences of every capture or check on the board.
When to choose: If the player is prone to forced variations and trades.

Psychological Grinder
Style: Pressure in sharp positions. Spends time choosing the most unpleasant, "poisonous" move, even if it's not the best.
When to choose: For methodical players who like to gradually "suffocate" their opponent in complex structures.

Group 4: Balance and Mistakes (Specific Archetypes)

Solid Pragmatist
Style: The golden mean. Distributes time evenly, avoiding unnecessary risks and unnecessary deliberation.
When to choose: For consistent players who rarely find themselves in time trouble, but don't set speed records either.

Time Trouble Addict
Style: Chronic indecision. Spends 20 minutes on the fifth move, just to get into the swing of things.
When to choose: For those who physically can't play fast at the start, regardless of difficulty.
Prototypes: Alexander Grischuk, Samuel Reshevsky.

How to use this description:

When choosing an archetype, don't look for a perfect match, but identify the player's dominant problem or strength:
If they're afraid of making mistakes—Perfectionist.
If they're afraid of not finishing—Calculator.
If they're afraid of losing on time—Speed Demon.
If they're afraid of simplifications—Chaos Attacker.
If they're simply reliable—Pragmatic.

Give your answer in the json format: {player1: archetype1, player2: archetype2}. Saying anything beyond the json is STRICTLY FORBIDDEN.


`;

const archetypes = [
	'Calculator',
	'Intuitive Genius',
	'Chaos Attacker',
	'Solid Pragmatist',
	'Time Trouble Addict',
	'Iron Fortress',
	'Blunder Prone Gambler',
	'Perfectionist',
	'Tactical Berserker',
	'Speed Demon',
	'Psychological Grinder',
];

const getBothArchetypesPrompt = (player1: string, player2: string) => {
	logger.log('[archetype.ts] getBothArchetypesPrompt called');
	return (
		instructions +
		`Which archetype suits ${player1} and ${player2} the best?`
	);
};
const getSingleArchetypePrompt = (player: string) => {
	logger.log('[archetype.ts] getSingleArchetypePrompt called');
	return instructions + `Which archetype suits ${player} the best?`;
};

const getRandomArchetype = (): string => {
	logger.log('[archetype.ts] getRandomArchetype called');
	const randomIndex = Math.floor(Math.random() * archetypes.length);
	return archetypes[randomIndex];
};

const ai = new GoogleGenAI({
	apiKey: process.env.GEMINI_KEY || 'api-key',
});

interface params {
	player1?: string;
	player2?: string;
}

export interface ArchetypeResponse {
	results: string[];
	isAiGenerated: boolean[];
}

export const requestArchetypes = async (
	players: params,
): Promise<ArchetypeResponse> => {
	logger.log('[archetype.ts] requestArchetypes called');
	const expectedCount = players.player1 && players.player2 ? 2 : 1;
	const isAiGenerated = Array<boolean>(expectedCount).fill(false);

	try {
		const response = await ai.models.generateContent({
			model: 'gemini-2.5-flash-lite',
			contents:
				players.player1 !== undefined && players.player2 !== undefined
					? getBothArchetypesPrompt(players.player1, players.player2)
					: getSingleArchetypePrompt(
							players.player1 || players.player2!,
						),
			config: {
				responseMimeType: 'application/json',
			},
		});

		const text = response.text;
		logger.log('Raw AI Response:', text);
		if (!text) throw new Error('Empty AI response');

		const parsed = JSON.parse(text) as Record<string, string>;
		const values = Object.values(parsed);

		const validated = values.map((val, index) => {
			if (archetypes.includes(val)) {
				isAiGenerated[index] = true;
				return val;
			}
			return getRandomArchetype();
		});

		while (validated.length < expectedCount) {
			validated.push(getRandomArchetype());
		}
		logger.log(
			'AI Archetype Response:',
			validated,
			'AI Generated Flags:',
			isAiGenerated,
		);
		return { results: validated, isAiGenerated: isAiGenerated };
	} catch (error) {
		logger.error('AI Archetype Request Failed:', error);
		return {
			results: Array.from({ length: expectedCount }, () =>
				getRandomArchetype(),
			),
			isAiGenerated: Array<boolean>(expectedCount).fill(false),
		};
	}
};
