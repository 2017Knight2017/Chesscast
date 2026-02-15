import { Injectable, Inject } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as sc from '../schema';
import { DrizzleAsyncProvider } from '../drizzle/drizzle.provider';
import * as q from 'drizzle-orm';
import { Queue } from 'bullmq';
import { InjectQueue } from '@nestjs/bullmq';


@Injectable()
export class MatchesService {
	constructor(
		@Inject(DrizzleAsyncProvider) private db: NodePgDatabase<typeof sc>,
		@InjectQueue('matches') private matchesQueue: Queue,
	) {}

	async createBroadcast(author: string, pgn: string, archetypes: [string, string]) {
		const [broadcast] = await this.db
			.insert(sc.broadcasts)
			.values({
				author: author,
				pgn: pgn
			})
			.returning();
		await this.matchesQueue.add('analyze', {
			id: broadcast.id,	
			pgn: pgn,
			archetypes: archetypes
		}, {
			attempts: 3, 
			backoff: 5000 
		});
		return broadcast;
	}

	async handleWorkerReport(id: string, evaluations: number[], durations: number[]) {
		const [broadcast] = await this.db
			.update(sc.broadcasts)
			.set({
				evaluations: evaluations,
				durations: durations,
			})
			.where(q.eq(sc.broadcasts.id, id))
			.returning();
		return broadcast;
	}


/*
// Интерфейс для структуры хода (согласован с Python)
interface ChessMove {
	fen: string;			
	san: string;			
	duration_ms: number; 
	turn: 'w' | 'b';	
}

@Injectable()
export class MatchesService {
	private readonly logger = new Logger(MatchesService.name);
*/
//	constructor(
//		private readonly prisma: PrismaService,
//		// Подключаем очередь 'chess_broadcast', которую создали в app.module
//		@InjectQueue('chess_broadcast') private broadcastQueue: Queue,
//	) {}

/*
	/**
	 * Метод запуска трансляции
	 
	async startBroadcasting(matchId: string) {
		// 1. Достаем матч из базы вместе с JSON-данными ходов
		const match = await this.prisma.match.findUnique({
			where: { id: matchId },
		});

		// 2. Валидация
		if (!match) {
			throw new NotFoundException(`Матч с ID ${matchId} не найден`);
		}

		if (match.status === 'RUNNING') {
			throw new BadRequestException('Трансляция уже запущена');
		}

		if (match.status === 'FINISHED') {
			throw new BadRequestException('Матч уже завершен');
		}

		// Приводим JSON из базы к нужному типу
		const moves = match.movesData as unknown as ChessMove[];

		if (!moves || moves.length === 0) {
			throw new BadRequestException(
				'Данные ходов не готовы. Сначала обработайте PGN через Python.',
			);
		}

		// 3. Обновляем статус в БД
		await this.prisma.match.update({
			where: { id: matchId },
			data: { 
				status: 'RUNNING',
				startedAt: new Date(), // Фиксируем время старта
			},
		});

		this.logger.log(`Запуск трансляции матча ${matchId}. Всего ходов: ${moves.length}`);

		// 4. ЗАПУСК ЦЕПНОЙ РЕАКЦИИ
		// Мы кладем в очередь задачу "Сделать Ход №0".
		// Воркер очереди (Processor) выполнит его и сам запланирует Ход №1.
		
		await this.broadcastQueue.add(
			'broadcast-move', // Имя задачи
			{
				matchId: matchId,
				moveIndex: 0,					// Начинаем с первого хода
				totalMoves: moves.length,
				moveData: moves[0],		// Данные конкретного хода
				allMoves: moves,			 // !Обычно передают только индекс, но для простоты передадим массив
			},
			{
				delay: 0, // Выполнить немедленно
				removeOnComplete: true, // Удалить задачу после выполнения, чтобы не засорять Redis
			},
		);

		return { 
			success: true, 
			message: 'Трансляция успешно запущена', 
			matchId 
		};
	}*/
}