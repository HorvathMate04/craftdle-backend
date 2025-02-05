import { Module } from '@nestjs/common';
import { RiddlesService } from './riddles.service';

@Module({
  providers: [RiddlesService]
})
export class RiddlesModule {}
