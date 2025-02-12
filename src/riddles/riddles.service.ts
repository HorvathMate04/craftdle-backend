import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class RiddlesService {

    constructor(
        private readonly prisma: PrismaService
    ){}

    async findDailyGameToday() {
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Dátumot nullázzuk, hogy csak a nap számítson

        const existingGame = await this.prisma.games.findFirst({
            where: {
                type: 3, // Daily riddle gamemode
                date: {
                    gte: today, // Mai nap eleje
                    lt: new Date(today.getTime() + 86400000), // Holnap eleje (tehát csak ma)
                },
            },
        });

        return existingGame; // Ha van találat, akkor már volt játék, ha nincs, akkor még nem
    }
}
