import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
	constructor() {
		super({
			jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
			ignoreExpiration: false,
			secretOrKey: process.env.JWTKEY || 'default_secret_key',
		});
	}

	validate(payload: { sub: number; username: string; email: string }) {
		return {
			id: payload.sub,
			username: payload.username,
			email: payload.email,
		};
	}
}
