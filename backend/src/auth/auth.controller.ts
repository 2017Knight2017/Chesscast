import { Controller, Post, Body, Get, UseGuards, Request, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';

interface RegisterData {
	email: string,
	username: string,
	password: string
}

interface LoginData {
	username: string,
	password: string
}

@Controller('auth')
export class AuthController {
	constructor(private authService: AuthService) {}

	@Post('register')
	async register(@Body() body: RegisterData) {
		return this.authService.register(body.email, body.username, body.password);
	}

	@Post('login')
	async login(@Body() body: LoginData) {
		const user = await this.authService.validateUser(body.username, body.password);
		if (!user) throw new UnauthorizedException('Incorrect Data');
		return this.authService.login(user);
	}

	@UseGuards(JwtAuthGuard)
	@Get('profile')
	getProfile(@Request() req) {
		return req.user;
	}
}