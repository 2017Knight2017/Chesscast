import {
	Controller,
	Post,
	Body,
	UnauthorizedException,
	Get,
	Req,
	UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { Request } from 'express';

interface RegisterData {
	email: string;
	username: string;
	password: string;
}

interface LoginData {
	username: string;
	password: string;
}

interface ProfileResponse {
	id: number;
	username: string;
	email: string;
}

@Controller('auth')
export class AuthController {
	constructor(private authService: AuthService) {}

	@Post('register')
	async register(@Body() body: RegisterData) {
		return this.authService.register(
			body.email,
			body.username,
			body.password,
		);
	}

	@Post('login')
	async login(@Body() body: LoginData) {
		const user = await this.authService.validateUser(
			body.username,
			body.password,
		);
		if (!user) throw new UnauthorizedException('Incorrect Data');
		return this.authService.login(user);
	}

	@Get('profile')
	@UseGuards(JwtAuthGuard)
	async getProfile(@Req() req: Request & { user?: ProfileResponse }): Promise<ProfileResponse> {
		if (!req.user) {
			throw new UnauthorizedException('Not authenticated');
		}
		return {
			id: req.user.id,
			username: req.user.username,
			email: req.user.email,
		};
	}
}
