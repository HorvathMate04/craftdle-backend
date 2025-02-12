import { Module } from '@nestjs/common';
import { TipService } from './tip.service';

@Module({
  providers: [TipService],
  exports: [TipService],
})
export class TipModule {}
