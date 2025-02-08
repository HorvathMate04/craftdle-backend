import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { SocketModule } from './socket/socket.module';
import { PrismaModule } from './prisma/prisma.module';
import { GameModule } from './game/game.module';
import { RiddlesModule } from './riddles/riddles.module';
import { TipsModule } from './tips/tips.module';
import { RecipesModule } from './recipes/recipes.module';
import { TokenModule } from './token/token.module';
import { EmailModule } from './email/email.module';
import { CacheModule } from './cache/cache.module';
import { AssetsModule } from './assets/assets.module';
import { AdminModule } from './admin/admin.module';
import { AchievementsModule } from './achievements/achievements.module';
import { SettingsModule } from './settings/settings.module';

@Module({
  imports: [UsersModule, SocketModule, PrismaModule, GameModule, RiddlesModule, TipsModule, RecipesModule, TokenModule, EmailModule, CacheModule, AssetsModule, AdminModule, AchievementsModule, SettingsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
