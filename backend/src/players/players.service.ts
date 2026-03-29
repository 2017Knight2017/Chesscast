import { Inject, Injectable } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as sc from '../schema';
import { DrizzleAsyncProvider } from '../drizzle/drizzle.provider';
import { and, eq, ilike, isNotNull } from 'drizzle-orm';

@Injectable()
export class PlayersService {
	constructor(
		@Inject(DrizzleAsyncProvider) private db: NodePgDatabase<typeof sc>,
	) {
		console.log('[PlayersService] constructor called');
	}

	async findByName(name: string) {
		console.log('[PlayersService] findByName called');
		return await this.db
			.select()
			.from(sc.players)
			.where(ilike(sc.players.name, `%${name}%`))
			.limit(10)
			.execute();
	}

	async updateArchetype(name: string, archetype: string) {
		console.log('[PlayersService] updateArchetype called');
		await this.db
			.update(sc.players)
			.set({ archetype: archetype })
			.where(eq(sc.players.name, name))
			.execute();

		console.log(`Successfully cached archetype for ${name}: ${archetype}`);
	}

	async getArchetypeFromDB(name: string) {
		console.log('[PlayersService] getArchetypeFromDB called');
		const result = await this.db
			.select()
			.from(sc.players)
			.where(
				and(
					eq(sc.players.name, name),
					isNotNull(sc.players.archetype)
				)
			);
		if (!result || !result[0]?.archetype) return undefined;
		else return result[0]?.archetype;
	}
}
