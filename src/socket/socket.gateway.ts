import {
  SubscribeMessage,
  WebSocketGateway,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Socket, Server } from 'socket.io';
import { UsersService } from 'src/users/users.service';
import { Game } from 'src/game/classes/Game';
import { Riddle } from 'src/game/classes/Riddle';
import { CacheService } from 'src/cache/cache.service';
import { RecipeFunctions } from 'src/game/utilities/RecipeFunctions';
import { createMatrixFromArray } from 'src/shared/utilities/arrayFunctions';
import { ITip } from 'src/game/interfaces/ITip';
import { GameService } from 'src/game/game.service';
import { Maintenance } from 'src/admin/classes/Maintenance';
import { AchievementManager } from 'src/achievements/AchievementManager';
import { PrismaService } from 'src/prisma/prisma.service';
import { AchievementsGateway } from 'src/achievements/achievements.gateway';

@WebSocketGateway({ cors: true })
export class SocketGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(SocketGateway.name);

  private server: Server;
  private reporter: NodeJS.Timeout | null = null;

  private static gameToClient: Map<string, Game> = new Map();

  constructor(
    private readonly usersService: UsersService,
    private readonly maintenanceService: Maintenance,
    private readonly achievementManager: AchievementManager,
    private readonly achievementGateway: AchievementsGateway,
  ) { }

  afterInit(server: Server) {
    this.server = server;
    this.logger.log('Socket Gateway initialized!');
  }

  /**
 * Eltávolítja a gamet a socket ID alapján.
 * @param socketId - A socket ID.
 */
  removeUserBySocketId(socketId: string): void {
    const game = SocketGateway.gameToClient.get(socketId);
    if (game) {
      SocketGateway.gameToClient.delete(socketId);
    };
  };

  // Kliens csatlakozása
  async handleConnection(client: Socket) {
    const token = client.handshake.auth?.token;
    if (!token) {
      this.logger.error('Connection rejected: No token provided.');
      client.disconnect();
      return;
    }

    // Token validáció a UsersService-en keresztül
    const user = this.usersService.getUserByToken(token);
    //console.log(user);

    if (!user) {
      this.logger.error('Connection rejected: Invalid token.');
      client.disconnect();
      return;
    }

    // Socket ID társítása a UsersService-ben
    this.usersService.associateSocketId(token, client.id);
    if (!user.isGuest) {
      const achievements = await this.achievementManager.achievementEventListener(user.id, [{ name: "regist", targets: ["regist"] }]);
      this.achievementGateway.emitAchievements(client.id, achievements)
    }
    this.logger.log(`Client connected: ${client.id} (User: ${user.username})`);
    const maintenance = await this.maintenanceService.getCurrentMaintenance();
    client.emit('maintenance', maintenance);

    if (maintenance.countdown != null) {
      clearTimeout(this.reporter);
      this.reporter = setTimeout(async () => {
        this.emitMaintenanceUpdate(await this.maintenanceService.getCurrentMaintenance());
      }, (maintenance.countdown + 1) * 1000);
    }
  }

  // Broadcast üzenet küldése minden kliensnek
  broadcastEvent(eventName: string, payload: any) {
    this.server.emit(eventName, payload);
  }

  // Kliens lecsatlakozása
  handleDisconnect(client: Socket) {
    // Felhasználó eltávolítása socket ID alapján
    const user = this.usersService.getUserBySocketId(client.id);
    if (user) {
      this.logger.log(`Client disconnected: ${client.id} (User: ${user.username})`);
      // Opció: törölheted a socketIdToUser map-ből, ha szükséges
    } else {
      this.logger.log(`Client disconnected: ${client.id} (No associated user found)`);
    }
  }

  @SubscribeMessage('credits')
  async handleCredits(client: Socket) {
    const user = this.usersService.getUserBySocketId(client.id);
    const achievements = await this.achievementManager.achievementEventListener(user.id, [{ name: "credits", targets: ["watched"] }])
    this.achievementGateway.emitAchievements(client.id, achievements)
  }

  emitMaintenanceUpdate(maintenance: {
    started: boolean,
    countdown: number | null
  }) {
    console.log(maintenance);
    this.broadcastEvent('maintenance', maintenance);
    if (maintenance.countdown != null) {
      clearTimeout(this.reporter);
      this.reporter = setTimeout(async () => {
        this.emitMaintenanceUpdate(await this.maintenanceService.getCurrentMaintenance());
      }, (maintenance.countdown + 1) * 1000);
    }
  }
}