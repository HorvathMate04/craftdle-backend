import { Controller, Get, Headers, UnauthorizedException } from '@nestjs/common';
import { GameService } from './game.service';

@Controller('game')
export class GameController {
    constructor(private readonly gameService: GameService,
    ) { }

    @Get('singleplayer')
    async getGameModesWithLastUnsolvedGame(@Headers('authorization') authorization: string) {
        try {
            const result = await this.gameService.getGameModesWithLastUnsolvedGame(authorization);
            return { data: { gamemodes: result } }
        } catch (err) {
            throw new UnauthorizedException();
        }
    }
}