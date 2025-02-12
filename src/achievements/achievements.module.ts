import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { CacheModule } from 'src/cache/cache.module';
import { GameModule } from 'src/game/game.module';
import { AchievementsGateway } from './achievements.gateway';
import { AchievementsService } from './achievements.service';

@Module({
    imports: [PrismaModule, CacheModule],
    providers: [AchievementsService, AchievementsGateway],
    exports: [AchievementsService, AchievementsGateway]
})
export class AchievementsModule {}
