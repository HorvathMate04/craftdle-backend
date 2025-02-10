import { Module } from '@nestjs/common';
import { SocketGateway } from './socket.gateway';
import { UsersModule } from '../users/users.module';
import { CacheModule } from '../cache/cache.module';
import { GameModule } from '../game/game.module';
import { Maintenance } from 'src/admin/classes/Maintenance';
import { PrismaService } from 'src/prisma/prisma.service';
import { AchievementsModule } from 'src/achievements/achievements.module';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
    imports: [
        UsersModule,
        CacheModule,
        GameModule,
        AchievementsModule,
        PrismaModule
    ],
    providers: [SocketGateway, Maintenance],
    exports: [SocketGateway],
})
export class SocketModule { }