import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';

@Module({
  imports: [
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST || 'localhost', // 'redis' внутри Docker
        port: 6379,
      },
    }),
    // Регистрация конкретной очереди
    BullModule.registerQueue({
      name: 'chess_moves',
    }),
  ],
})
export class AppModule {}