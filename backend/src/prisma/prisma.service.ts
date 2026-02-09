import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '../../generated/prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    // Здесь можно настроить логирование запросов в консоль (полезно при разработке)
    super({
      log: [
        { emit: 'event', level: 'query' },
        { emit: 'stdout', level: 'info' },
        { emit: 'stdout', level: 'warn' },
        { emit: 'stdout', level: 'error' },
      ],
    } as any);
  }

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log('🐘 Успешное подключение к PostgreSQL через Prisma');
    } catch (error) {
      this.logger.error('❌ Ошибка подключения к базе данных', error);
      process.exit(1); // Завершаем процесс, если база недоступна
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log('🔌 Соединение с PostgreSQL закрыто');
  }
}