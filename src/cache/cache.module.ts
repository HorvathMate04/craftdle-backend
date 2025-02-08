import { Global, Module } from '@nestjs/common';
import { CacheService } from './cache.service';
import { PrismaModule } from 'src/prisma/prisma.module';

@Global()
@Module({
    imports: [PrismaModule],
    providers: [CacheService],
    exports: [CacheService],
})
export class CacheModule { }