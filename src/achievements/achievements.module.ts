import { Module } from '@nestjs/common';
import { AchievementsGateway } from './achievements.gateway';

@Module({
  providers: [AchievementsGateway]
})
export class AchievementsModule {}
