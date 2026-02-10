/*
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
*/

import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { MatchesModule } from './matches/matches.module';

@Module({
	imports: [
		BullModule.forRoot({
			connection: {
				host: process.env.REDIS_HOST, // 'redis' внутри Docker
				port: 6379,
			},
		}),
		// Регистрация очереди, которую использует MatchesService/Processor
		BullModule.registerQueue({
			name: 'chess_broadcast',
		}),
		// Импортируем модуль матчей, чтобы контроллер и воркер были подключены
		MatchesModule,
	],
})
export class AppModule {}