import { Global, Module } from '@nestjs/common';
import { CacheService } from './cache.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { RecipesModule } from 'src/recipes/recipes.module';

@Global()
@Module({
    imports: [PrismaModule, RecipesModule],
    providers: [CacheService],
    exports: [CacheService],
})
export class CacheModule { }