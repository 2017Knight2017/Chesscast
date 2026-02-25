import { Injectable, Inject, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { DrizzleAsyncProvider } from '../drizzle/drizzle.provider';
import * as sc from '../schema';
import { eq, or } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';

interface User {
	id: number,
	email: string,
	username: string
}

@Injectable()
export class AuthService {
	constructor(
		@Inject(DrizzleAsyncProvider) private db: NodePgDatabase<typeof sc>,
		private jwtService: JwtService,
	) {}

	async register(email: string, username: string, pass: string) {
		const existing = await this.db
			.select()
			.from(sc.users)
			.where(or(eq(sc.users.email, email), eq(sc.users.username, username)))
			.limit(1);
		if (existing.length > 0) throw new BadRequestException('Email уже занят');

		const hashedPassword = await bcrypt.hash(pass, 10);

		const [newUser] = await this.db
			.insert(sc.users)
			.values({
				email,
				username,
				password: hashedPassword,
			})
			.returning();

		return this.login(newUser);
	}

	async validateUser(username: string, pass: string) {
		const [user] = await this.db
			.select()
			.from(sc.users)
			.where(eq(sc.users.username, username))
			.limit(1);
		
		if (user && await bcrypt.compare(pass, user.password)) {
			const { password, ...result } = user;
			return result;
		}
		return null;
	}

	async login(user: User) {
		const payload = { email: user.email, username: user.username, sub: user.id };
		return {
			access_token: this.jwtService.sign(payload),
			user: { id: user.id, username: user.username, email: user.email }
		};
	}
}