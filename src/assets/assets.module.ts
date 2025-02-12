import { Module } from '@nestjs/common';
import { AssetsController } from './assets.controller';
import { AssetsService } from './assets.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { AchievementsModule } from 'src/achievements/achievements.module';
import { TokenModule } from 'src/token/token.module';

@Module({
  imports: [PrismaModule, AchievementsModule, TokenModule],
  controllers: [AssetsController],
  providers: [AssetsService],
  exports: [AssetsService],
})
export class AssetsModule {}
