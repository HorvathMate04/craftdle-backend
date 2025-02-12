import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { IAchievement } from './interfaces/achievement.interface';
import { Game } from 'src/game/classes/game.class';
import { ITip } from 'src/tip/interfaces/tip.interface';
import { getStreak } from 'src/users/utilities/user.util';

@Injectable()
export class AchievementsService {
    constructor(
        private readonly prisma: PrismaService
    ) {}

    generateTemporalAchievement(title: string, description: string, src: string, rarity: number): IAchievement {
        return {
            title: title,
            description: description,
            icon: src,
            rarity: rarity
        }
    }

    async watchSpecialSolveCases(game: Game, userId: number): Promise<string[]> {
        let additionalTargets = []
        if (Number(game.riddle.gamemode) == 6) {
            const foods = ["cake0", "cookie0", "goldenApple0", "goldenCarrot0", "pumpkinPie0", "mushroomStew0", "rabbitStew0", "beetrootSoup0", "suspiciousStew0"]
            if (foods.includes(game.riddle.recipeGroup)) {
                additionalTargets.push("food");
            }
        } else if(Number(game.riddle.gamemode) == 3){
            if(await getStreak(userId) >= 365){
                additionalTargets.push("365");
            }
        }
        if (game.riddle.numberOfGuesses == 1) {
            additionalTargets.push("zero");
        }
        let chickenMaterialsCount = 0;
        const chickenMaterials = ["egg", "feather"]
        let notWaxedRecipesCount = 0;
        game.riddle.tips.forEach(tip => {
            if (!tip.item.id.includes("waxed")) {
                notWaxedRecipesCount++;
            }
            chickenMaterials.forEach(mat => {
                if (Object.keys(tip.table).includes(mat)) {
                    chickenMaterialsCount++;
                }
            })
        });
        if (chickenMaterialsCount >= 5) {
            additionalTargets.push("chicken")
        }
        if (notWaxedRecipesCount <= 1 && game.riddle.numberOfGuesses > 1) {
            additionalTargets.push("copper")
        }
        return additionalTargets;
    }

    watchSpecialCraftCases(tip: ITip): string[]{
        let additionalTargets = []
        // const gaRecipe: Recipe = this.cacheService.getCachedData('recipes')["gaLogo0"];
        // if(RecipeFunctions.compareShapedRecipes(gaRecipe.recipe, gaRecipe, createMatrixFromArray(tip.table), 3).solved){
        //     additionalTargets.push("ga");
        // }
        return additionalTargets
    }

    async achievementEventListener(userId: number, events: Array<{ name: string, targets: string[] }>, game?: Game, tip?: ITip) {
        let aquiredAchievements: IAchievement[] = [];
    
        for (const event of events) {
            switch (event.name) {
                case "solve":
                    event.targets = event.targets.concat(await this.watchSpecialSolveCases(game, userId));
                    break;
                case "craft":
                    event.targets = event.targets.concat(this.watchSpecialCraftCases(tip));
                    break;
            }
        }
    
        const achievementPromises = events.flatMap(event => 
            event.targets.map(target => this.updateAchievementProgress(userId, event.name, target))
        );
    
        const results = await Promise.all(achievementPromises);
        
        results.forEach(res => {
            if (res) {
                aquiredAchievements.push(...res);
            }
        });
    
        return aquiredAchievements;
    }    

    async updateAchievementProgress(userId: number, event: string, target: string | null, increment: number = 1) {
        // Achievementek lekérdezése a megadott event és target alapján
        const achievements = await this.prisma.achievements.findMany({
            where: {
                event: event,
                target: target
            }
        });

        let unlockedAchievements: IAchievement[] = []; // Ide fogjuk gyűjteni a már megszerzett achievementeket.

        for (const achievement of achievements) {
            // Felhasználói progressz lekérdezése vagy létrehozása
            const userAchievement = await this.prisma.users_achievements.findUnique({
                where: {
                    user_achievement: {
                        user: userId,
                        achievement: achievement.id
                    }
                }
            });

            // Ha a felhasználó már megszerezte az achievementet, skipeljük
            if (userAchievement && userAchievement.progress >= achievement.goal) {
                continue;
            }

            // Ha még nem teljesítette, akkor növeljük a progresszt
            await this.prisma.users_achievements.upsert({
                where: {
                    user_achievement: {
                        user: userId,
                        achievement: achievement.id
                    }
                },
                update: {
                    progress: {
                        increment: increment
                    }
                },
                create: {
                    user: userId,
                    achievement: achievement.id,
                    progress: increment
                }
            });

            // Ha a progressz elérte a célt, a felhasználó megkapja az achievementet
            if (userAchievement?.progress + increment >= achievement.goal || achievement.goal == 1) {
                // Achievment unlocked logika
                await this.giveRewards(achievement.id, userId);

                // Adjunk hozzá a már megszerzett achievementek listájához
                unlockedAchievements.push(this.generateTemporalAchievement(
                    achievement.title,
                    achievement.description,
                    achievement.icon,
                    achievement.is_secret ? 1 : 2
                ));
            }
        }

        // Ha voltak megszerzett achievementek, küldjük vissza őket
        if (unlockedAchievements.length > 0) {
            return unlockedAchievements;
        }
    }

    async giveRewards(achievementId: number, userId: number) {
        const rewards = await this.prisma.rewards.findMany({
            where: {
                achievement: achievementId
            }
        });
        rewards.map(async (reward) => {
            if (reward.reward_type == 1) {
                // Profilkép hozzáadása
                return this.prisma.users_profile_pictures.create({
                    data: {
                        user: userId,
                        profile_picture: reward.reward,
                        is_set: false
                    }
                });
            } else {
                // Profilkeret hozzáadása
                return this.prisma.users_profile_borders.create({
                    data: {
                        user: userId,
                        profile_border: reward.reward,
                        is_set: false
                    }
                });
            }
        })
    }
}
