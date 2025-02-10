import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { SettingsModule } from 'src/settings/settings.module';
import { AssetsModule } from 'src/assets/assets.module';

@Module({
  imports: [SettingsModule, AssetsModule],
  controllers: [UsersController],
  providers: [UsersService]
})
export class UsersModule {}
