import { Injectable, OnModuleInit } from '@nestjs/common';
import * as NodeCache from 'node-cache';
import * as fs from 'fs';
import * as path from 'path';
import { PrismaService } from 'src/prisma/prisma.service';
import { Recipe } from 'src/game/classes/Recipe';

@Injectable()
export class CacheService implements OnModuleInit {
    private cache = new NodeCache();

    constructor(private readonly prisma: PrismaService) { }

    async onModuleInit() {
        const recipesFilePath = path.join(__dirname, '../../../recipes.json');
        const recipesData = await this.loadJsonFile(recipesFilePath);

        const convertedRecipes = this.convertRecipe(recipesData.data);
        this.cache.set('recipes', convertedRecipes);

        const itemsFromDb = await this.getItemsFromDatabase();
        this.cache.set('items', itemsFromDb);

        console.log('JSON és adatbázis adatok sikeresen cachelve');
    }

    private async loadJsonFile(filePath: string): Promise<any> {
        return new Promise((resolve, reject) => {
            fs.readFile(filePath, 'utf8', (err, data) => {
                if (err) {
                    return reject(err);
                }
                resolve(JSON.parse(data));
            });
        });
    }

    private convertRecipe(data) {
        const convertedData = {};

        Object.keys(data).forEach(group => {
            let recipes = [];
            data[group].forEach(recipeData => {
                recipes.push(new Recipe(recipeData))
            })
            convertedData[group] = recipes;
        });

        return convertedData;
    }

    private async getItemsFromDatabase() {
        const items = await this.prisma.items.findMany();
        let convertedItems = [];
        for(const item of items) {
            convertedItems.push({
                id: item.item_id,
                dbId: item.id,
                name: item.name,
                src: item.src,
            });
        }
        return convertedItems;
    }

    getCachedData(key: string): any {
        return this.cache.get(key);
    }
}