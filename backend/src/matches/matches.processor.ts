import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job, Queue } from 'bullmq';
import { Logger, Inject } from '@nestjs/common';
// Здесь ты бы импортировал WebSocketGateway, чтобы слать данные клиентам
// import { MatchesGateway } from './matches.gateway';

@Processor('chess_broadcast')
export class MatchesProcessor extends WorkerHost {
  private readonly logger = new Logger(MatchesProcessor.name);

  constructor(@Inject('BullQueue_chess_broadcast') private queue: Queue) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    const { matchId, moveIndex, totalMoves, moveData, allMoves } = job.data;

    // 1. ЛОГИКА ТРАНСЛЯЦИИ
    // Здесь мы отправляем данные по WebSocket всем, кто подписан на этот матч
    this.logger.log(`📢 Матч ${matchId}: Ход ${moveIndex + 1}/${totalMoves} (${moveData.san})`);
    
    // this.matchesGateway.server.to(`match_${matchId}`).emit('new_move', moveData);

    // 2. ПЛАНИРОВАНИЕ СЛЕДУЮЩЕГО ХОДА (Рекурсия)
    const nextIndex = moveIndex + 1;

    if (nextIndex < totalMoves) {
      const nextMove = allMoves[nextIndex];
      const delay = moveData.duration * 1000; // Ждем столько, сколько длился текущий ход

      this.logger.log(`⏳ Следующий ход через ${delay} мс`);

      // Добавляем следующую задачу в ту же очередь
      await this.queue.add(
        'broadcast-move',
        {
            matchId,
            moveIndex: nextIndex,
            totalMoves,
            moveData: nextMove,
            allMoves
        },
        {
            delay: delay // Самое важное: отложенное выполнение!
        }
      );
    } else {
        this.logger.log(`🏁 Матч ${matchId} завершен!`);
        // Тут можно обновить статус в БД на FINISHED
    }
  }
}