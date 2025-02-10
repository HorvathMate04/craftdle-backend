import { SubscribeMessage, WebSocketGateway } from '@nestjs/websockets';
import { Server } from 'socket.io';
import { Socket } from 'socket.io';

@WebSocketGateway({ cors: true })
export class GameGateway {

  private server: Server;

    constructor(
      private readonly usersService: UsersService,
      private readonly cacheService: CacheService,
      private readonly achievementManager: AchievementManager,
      private readonly achievementGateway: AchievementsGateway,
    ) { }

  afterInit(server: Server) {
    this.server = server;
  }

  // Egyedi események kezelése
  @SubscribeMessage('startGame')
  async handleNewGame(client: Socket, payload: { newGame: boolean, gamemode: number }) {
    const riddle = new Riddle(this.cacheService, this.gameService);
    const game = new Game(riddle, client.id, this.usersService);
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
    console.log("csecs")
    if (game && !game.riddle.guessedRecipes.includes(payload.item.id)) {
      console.log("csecsek")
      const tippedMatrix = createMatrixFromArray(payload.table);
      const baseRecipe = RecipeFunctions.getRecipeById(payload.item.group, payload.item.id, this.cacheService);
      if ((game.riddle.gamemode == 1 && this.gameService.checkTutorialScript(payload.item.group, game.riddle.numberOfGuesses)) || game.riddle.gamemode != 1) {
        console.log("csecses")
        if (RecipeFunctions.validateRecipe(tippedMatrix, baseRecipe)) {
          console.log("csecsnek")
          game.riddle.guessedRecipes.push(payload.item.id);
          game.riddle.numberOfGuesses++;
          const result = RecipeFunctions.compareTipWithRiddle(tippedMatrix, game.riddle);
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
            const achievements = await this.achievementManager.achievementEventListener(game.user.id, events, game, payload);
            this.achievementGateway.emitAchievements(client.id, achievements);
            this.usersService.addItemToCollection(game.user.id, game.riddle.tips[game.riddle.tips.length - 1].item, client.id);
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
