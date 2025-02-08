import { Module } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { TokenModule } from 'src/token/token.module';

@Module({
  imports: [TokenModule],
  providers: [SettingsService],
  exports: [SettingsService],
})
export class SettingsModule {}
