import { HttpException, HttpStatus } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";

export async function getUserById(userId: number, prisma: PrismaService) {
    try {
        const user = await this.prisma.users.findUnique({ where: { id: userId } });
        if (!user) {
            throw new HttpException(`User with ID ${userId} not found.`, HttpStatus.NOT_FOUND);
        }
        return user;
    } catch (error) {
        throw new HttpException("Failed to retrieve user data.", HttpStatus.INTERNAL_SERVER_ERROR);
    }
}

export async function getStreak(userId: number) {
    const playedDailyGames = await this.prisma.games.findMany({
        where: {
            player: userId,
            is_solved: true,
            gamemodes: {
                name: "Daily"
            }
        },
        orderBy: {
            date: 'desc'
        }
    });

    let streak = 0;
    const uniqueDates = new Set<number>();
    let lastDate = new Date(playedDailyGames[0]?.date);
    lastDate.setHours(0, 0, 0, 0);
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);
    
    if (lastDate.getTime() > yesterday.getTime()) {
        for (let game of playedDailyGames) {
            const gameDate = new Date(game.date);
            gameDate.setHours(0, 0, 0, 0);
            if (uniqueDates.has(gameDate.getTime())) {
                continue;
            }
            if (gameDate.getTime() !== lastDate.getTime()) {
                break;
            }
            uniqueDates.add(gameDate.getTime());
            streak++;
            lastDate.setDate(lastDate.getDate() - 1);
        }
    }
    return streak;
}