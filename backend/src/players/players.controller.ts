import { Controller, Get, Query, Param } from '@nestjs/common';
import { PlayersService } from './players.service';

@Controller('players')
export class PlayersController {
  constructor(private readonly playersService: PlayersService) {}

  @Get('search')
  async searchPlayers(@Query('name') name: string) {
    if (!name || name.length < 2) return [];

    return this.playersService.findByName(name);
  }

  @Get('by-username/:username')
  async getPlayerByUsername(@Param('username') username: string) {
    return this.playersService.findByUsername(username);
  }
}
