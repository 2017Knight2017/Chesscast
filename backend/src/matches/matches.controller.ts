import { Controller, Post, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { MatchesService } from './matches.service';

@Controller('matches')
export class MatchesController {
  constructor(private readonly matchesService: MatchesService) {}

  @Post(':id/start')
  @HttpCode(HttpStatus.OK)
  async startMatch(@Param('id') id: string) {
    // Логика:
    // 1. Проверить статус в Redis/DB
    // 2. Запустить таймер трансляции
    // 3. Вернуть успех
    return await this.matchesService.startBroadcasting(id);
  }
}