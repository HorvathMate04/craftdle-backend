import { Module } from '@nestjs/common';
import { RiddlesService } from './riddles.service';
import { RecipesModule } from 'src/recipes/recipes.module';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [RecipesModule, PrismaModule],
  providers: [RiddlesService]
})
export class RiddlesModule {}
