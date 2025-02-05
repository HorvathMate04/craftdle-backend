import { Module } from '@nestjs/common';
import { RecipesService } from './recipes.service';

@Module({
  providers: [RecipesService]
})
export class RecipesModule {}
