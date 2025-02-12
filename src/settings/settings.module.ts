import { Module } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { TokenModule } from 'src/token/token.module';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [PrismaModule, TokenModule],
  providers: [SettingsService],
  exports: [SettingsService],
})
export class SettingsModule {}
