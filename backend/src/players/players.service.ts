import { Inject, Injectable } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as sc from '../schema';
import { DrizzleAsyncProvider } from '../drizzle/drizzle.provider';
import { eq, ilike } from 'drizzle-orm';

@Injectable()
export class PlayersService {
	constructor(
		@Inject(DrizzleAsyncProvider) private db: NodePgDatabase<typeof sc>,
	) {}

	async findByName(name: string) {
		return await this.db
			.select()
			.from(sc.players)
			.where(ilike(sc.players.name, `%${name}%`))
			.limit(10)
			.execute();
	}

	async updateArchetype(name: string, archetype: string) {
		await this.db
			.update(sc.players)
			.set({ archetype: archetype })
			.where(eq(sc.players.name, name))
			.execute();

		console.log(`Successfully cached archetype for ${name}: ${archetype}`);
	}
}