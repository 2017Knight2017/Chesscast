import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './jwt.strategy';
import { DrizzleModule } from '../drizzle/drizzle.module';

@Module({
	imports: [
		PassportModule,
		DrizzleModule,
		JwtModule.register({
			secret: process.env.KEY || 'default_secret_key',
			signOptions: { expiresIn: '1d' },
		}),
	],
	providers: [AuthService, JwtStrategy],
	controllers: [AuthController],
	exports: [AuthService],
})
export class AuthModule {}
