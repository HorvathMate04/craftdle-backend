import { Module } from '@nestjs/common';
import { GameService } from './game.service';
import { GameController } from './game.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { GameGateway } from './game.gateway';
import { TokenModule } from 'src/token/token.module';
import { UsersModule } from 'src/users/users.module';
import { AssetsModule } from 'src/assets/assets.module';
import { AchievementsModule } from 'src/achievements/achievements.module';
import { CacheModule } from 'src/cache/cache.module';
import { RecipesModule } from 'src/recipes/recipes.module';
import { TipModule } from 'src/tip/tip.module';

@Module({
    imports: [PrismaModule, TokenModule, AssetsModule, AchievementsModule, UsersModule, CacheModule, RecipesModule, TipModule],
    controllers: [GameController],
    providers: [GameService, GameGateway],
    exports: [GameService],
})
export class GameModule { }
