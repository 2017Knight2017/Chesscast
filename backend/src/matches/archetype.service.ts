import { Injectable, Logger, Inject } from '@nestjs/common';
import { PlayersService } from 'src/players/players.service';
import { requestArchetypes } from "src/matches/utils/archetype-generator";
import { ARCHETYPE_OPTIONS } from './matches.types';

@Injectable()
export class ArchetypeService {
	private readonly logger = new Logger(ArchetypeService.name);

	constructor(
		@Inject(PlayersService) private playersService: PlayersService,
	) {}

	private getValidArchetype(key: string): string | undefined {
		return ARCHETYPE_OPTIONS[key as keyof typeof ARCHETYPE_OPTIONS];
	}

	async validate(whitePlayer: string, blackPlayer: string, archetypes: [string, string]) {
		this.logger.log('archetypeValidation called');
		const [whiteDB, blackDB] = await Promise.all([
			this.playersService.getArchetypeFromDB(whitePlayer),
			this.playersService.getArchetypeFromDB(blackPlayer)
		]);

		let validatedArchetypes: [string | undefined, string | undefined] = [
			this.getValidArchetype(archetypes[0]) || whiteDB,
			this.getValidArchetype(archetypes[1]) || blackDB 
		];
		let isArchetypeAiGenerated: boolean[] = [false, false];
		
		const archetypeMask = (validatedArchetypes[0] === undefined ? 0 : 1) + (validatedArchetypes[1] === undefined ? 0 : 2);
		
		switch (archetypeMask) {
			case 0:
				const { results, isAiGenerated } = await requestArchetypes({player1: whitePlayer, player2: blackPlayer});
				validatedArchetypes = results.map((archetype: string) => this.getValidArchetype(archetype)) as [string, string];
				isArchetypeAiGenerated = isAiGenerated;
				break;
			case 1:
				const res1 = await requestArchetypes({player2: blackPlayer});
				validatedArchetypes[1] = this.getValidArchetype(res1.results[0]);
				isArchetypeAiGenerated[1] = res1.isAiGenerated[0];
				break;
			case 2:
				const res2 = await requestArchetypes({player1: whitePlayer});
				validatedArchetypes[0] = this.getValidArchetype(res2.results[0]);
				isArchetypeAiGenerated[0] = res2.isAiGenerated[0];
				break;
			case 3:
				this.logger.log(`Both archetypes from DB/Input: ${validatedArchetypes}`);
				break;
		}

		if (isArchetypeAiGenerated[0] && whitePlayer) {
			await this.playersService.updateArchetype(whitePlayer, validatedArchetypes[0]!);
		}

		if (isArchetypeAiGenerated[1] && blackPlayer) {
			await this.playersService.updateArchetype(blackPlayer, validatedArchetypes[1]!);
		}

		return validatedArchetypes;
	}
}