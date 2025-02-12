import { Server, Socket } from 'socket.io';
import { WebSocketGateway, SubscribeMessage } from '@nestjs/websockets';
import { AchievementsGateway } from 'src/achievements/achievements.gateway';
import { AchievementsService } from 'src/achievements/achievements.service';
import { CacheService } from 'src/cache/cache.service';
import { Riddle } from 'src/riddles/classes/riddle.class';
import { UsersService } from 'src/users/users.service';
import { Game } from './classes/game.class';
import { RecipesService } from 'src/recipes/recipes.service';
import { GameService } from './game.service';
import { SocketGateway } from 'src/socket/socket.gateway';
import { ITip } from 'src/tip/interfaces/tip.interface';
import { createMatrixFromArray } from 'src/sharedComponents/utilities/array.util';
import { TipService } from 'src/tip/tip.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { AssetsService } from 'src/assets/assets.service';

@WebSocketGateway({ cors: true })
export class GameGateway {

  private server: Server;

  constructor(
    private readonly usersService: UsersService,
    private readonly cacheService: CacheService,
    private readonly recipesService: RecipesService,
    private readonly gameService: GameService,
    private readonly tipService: TipService,
    private readonly achievementsService: AchievementsService,
    private readonly achievementGateway: AchievementsGateway,
    private readonly prisma: PrismaService,
    private readonly assetsService: AssetsService
  ) { }

  afterInit(server: Server) {
    this.server = server;
  }

  @SubscribeMessage('startGame')
  async handleNewGame(client: Socket, payload: { newGame: boolean, gamemode: number }) {
    const riddle = new Riddle(this.cacheService, this.gameService, this.recipesService);
    const game = new Game(riddle, this.usersService.getUserBySocketId(client.id));
    if (payload.newGame) {
      riddle.initializeNewGame(payload.gamemode);
      game.id = await this.gameService.saveGame(game);
    } else {
      game.id = await riddle.initializeExistingGame(this.usersService.getUserBySocketId(client.id), payload.gamemode)
    }
    SocketGateway.gameToClient.set(client.id, game);

    client.emit('guess', riddle.toJSON());
  }

  @SubscribeMessage('guess')
  async handleGuess(client: Socket, payload: ITip) {
    const game = SocketGateway.gameToClient.get(client.id);
    if (game && !game.riddle.guessedRecipes.includes(payload.item.id)) {
      const tippedMatrix = createMatrixFromArray(payload.table);
      const baseRecipe = this.recipesService.getRecipeById(payload.item.group, payload.item.id, this.cacheService);
      if ((game.riddle.gamemode == 1 && this.tipService.checkTutorialScript(payload.item.group, game.riddle.numberOfGuesses)) || game.riddle.gamemode != 1) {
        if (this.recipesService.validateRecipe(tippedMatrix, baseRecipe)) {
          game.riddle.guessedRecipes.push(payload.item.id);
          game.riddle.numberOfGuesses++;
          const result = this.recipesService.compareTipWithRiddle(tippedMatrix, game.riddle);
          const tip = {
            item: {
              id: baseRecipe.id,
              name: baseRecipe.name,
              src: baseRecipe.src
            },
            table: result.result,
            date: new Date()
          }
          game.riddle.tips.push(tip);
          await this.gameService.saveTip(tip, game.id);
          let events = [
            {
              name: 'craft',
              targets: [game.riddle.recipe[0].id]
            }
          ]
          if (result.solved) {
            game.riddle.solved = true
            await this.gameService.changeGameStatus(game.id);
            const gamemode = await this.prisma.gamemodes.findFirst({ where: { id: Number(game.riddle.gamemode) } })
            events.push({
              name: 'solve',
              targets: [gamemode.name]
            });
            const achievements = await this.achievementsService.achievementEventListener(game.user.id, events, game, payload);
            this.achievementGateway.emitAchievements(client.id, achievements);
            this.assetsService.addItemToCollection(game.user.id, game.riddle.tips[game.riddle.tips.length - 1].item, client.id);
          }
          client.emit('guess', game.riddle.toJSON());
          if (result.solved) {
            SocketGateway.gameToClient.delete(client.id)
          }
        }
      }
    }
  }
}
