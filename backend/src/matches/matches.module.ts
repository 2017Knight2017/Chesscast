import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { MatchesController } from './matches.controller';
import { MatchesService } from './matches.service';
import { MatchesProcessor } from './matches.processor';

@Module({
  imports: [
    // 1. Регистрируем очередь 'chess_broadcast' в Redis.
    // Это позволяет использовать @InjectQueue('chess_broadcast') в сервисе.
    BullModule.registerQueue({
      name: 'chess_broadcast',
    }),
    // 2. Импортируем наш глобальный модуль Prisma, чтобы иметь доступ к БД.
    PrismaModule,
  ],
  controllers: [
    // 3. Регистрируем контроллер, чтобы маршруты типа POST /matches/:id/start стали доступны.
    MatchesController
  ],
  providers: [
    // 4. MatchesService содержит бизнес-логику.
    MatchesService, 
    // 5. MatchesProcessor — это "воркер", который будет реально обрабатывать ходы из очереди.
    MatchesProcessor
  ],
  // Экспортируем сервис, если он понадобится в других модулях (например, в Gateway)
  exports: [MatchesService],
})
export class MatchesModule {}