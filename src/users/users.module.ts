import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { SettingsModule } from 'src/settings/settings.module';
import { AssetsModule } from 'src/assets/assets.module';
import { PrismaModule } from 'src/prisma/prisma.module';
import { TokenModule } from 'src/token/token.module';
import { AccountUtilities } from './utilities/account.util';
import { EmailModule } from 'src/email/email.module';

@Module({
  imports: [SettingsModule, AssetsModule, PrismaModule, TokenModule, EmailModule],
  controllers: [UsersController],
  providers: [UsersService, AccountUtilities],
  exports: [UsersService],
})
export class UsersModule {}
