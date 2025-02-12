import { CacheService } from "src/cache/cache.service";
import { GameService } from "src/game/game.service";
import { Recipe } from "src/recipes/classes/recipe.class";
import { RecipesService } from "src/recipes/recipes.service";
import { IItem } from "src/sharedComponents/interfaces/item.interface";
import { shuffleArray } from "src/sharedComponents/utilities/array.util";
import { ICheckedTip } from "src/tip/interfaces/tip.interface";

type RecipeData = {
    [key: string]: Recipe[];
};

export class Riddle {
    recipeGroup: string;
    recipe: Recipe[];
    templateRecipe: Recipe;
    hints: string[] | null = null;
    numberOfGuesses: number = 0;
    guessedRecipes: string[] = [];
    tips: ICheckedTip[] = [];
    gamemode: number;
    inventory: IItem[];
    solved: boolean = false;

    constructor(
        private readonly cacheService: CacheService, 
        private readonly gameService: GameService,
        private readonly recipesService: RecipesService
    ) { }

    async initializeExistingGame(user, gamemode) {
        this.gamemode = gamemode;
        const recipes = this.cacheService.getCachedData('recipes');
        const items = this.cacheService.getCachedData('items');
        const game = await this.gameService.loadLastGame(user, this.gamemode);
        this.recipeGroup = game.riddle;
        this.recipe = recipes[this.recipeGroup];
        this.templateRecipe = this.getRandomItem(this.recipe);
        this.inventory = Number(this.gamemode) === 6 ? await this.gameService.loadInventory(game.id) : items;
        this.hints = Number(this.gamemode) !== 7 ? await this.gameService.loadHints(game.id) : null;
        this.tips = await this.gameService.loadTips(game.id);
        this.guessedRecipes = this.tips.map(tip => tip.item.id);
        this.numberOfGuesses = this.guessedRecipes.length;

        return game.id;
    }

    initializeNewGame(gamemode): void {
        this.gamemode = gamemode;
        const recipes = this.cacheService.getCachedData('recipes');
        const items = this.cacheService.getCachedData('items');

        const validGroups = this.getValidGroups(recipes);

        if (validGroups.length === 0) {
            throw new Error('Nincs olyan group, amelyik támogatná ezt a gamemode-ot.');
        }
        const randomGroupKey = this.gamemode == 1? "axe0": this.getRandomItem(validGroups);
        const selectedGroup = recipes[randomGroupKey];

        this.recipe = selectedGroup;
        this.templateRecipe = this.getRandomItem(this.recipe);
        this.recipeGroup = randomGroupKey;
        this.inventory = Number(this.gamemode) === 6? this.createResourceInventory(recipes, items): items;
        this.hints = Number(this.gamemode) !== 7? this.generateHints(recipes): null;
    }

    private gatherItems(items, itemIds: Set<string>) {
        let result = [];
        items.forEach(item => {
            if (itemIds.has(item.id)) {
                result.push(item);
                itemIds.delete(item.id);
            }
        });
        return result;
    }

    private createSetFromMaterials(materials: Array<Array<string>>): Set<string> {
        let result: Set<string> = new Set();
        materials.forEach(material => {
            result.add(material[Math.floor(Math.random() * material.length)]);
        });
        return result;
    }

    private createResourceInventory(recipes, items) {
        let graph = this.createSetFromMaterials(this.templateRecipe.required);
        while (graph.size < 20) {
            for (const group of shuffleArray(Object.keys(recipes))) {
                for (const recipe of shuffleArray(recipes[group])) {
                    const mats = recipe.required;
                    if (this.checkForSameMaterial(graph, mats)) {
                        let tempGraph = this.addMaterialsToSet(graph, mats);
                        if (tempGraph.size > graph.size) {
                            graph = tempGraph;
                        }
                        break;
                    }
                };
                if(graph.size >= 20) {
                    break;
                }
            };
        }
        return this.gatherItems(items, graph);
    }

    private checkForSameMaterial(set, mats) {
        return mats.some(mat =>
            mat.some(element => set.has(element))
        );
    }

    private addMaterialsToSet(set, materials) {
        const processedMaterials = this.processMaterials(materials, set);
        processedMaterials.forEach(mat => set.add(mat));
        return set;
    }

    private processMaterials(materials, set) {
        let result = [];
        materials.forEach(material => {
            if (!this.setAlreadyHasMaterial(set, material)) {
                result.push(material[Math.floor(Math.random() * material.length)]);
            }
        });
        return result;
    }

    private setAlreadyHasMaterial(set, material) {
        material.forEach(element => {
            if(set.has(element)) {
                return true;
            }
        });
        return false;
    }

    private getValidGroups(recipes: Record<string, any>): string[] {
        return Object.keys(recipes).filter(groupKey => {
            return recipes[groupKey].some(recipe => recipe.enabledGamemodes.includes(Number(this.gamemode)));
        });
    }

    private getRandomItem<T>(array: T[]): T {
        return array[Math.floor(Math.random() * array.length)];
    }

    private generateHints(recipes): string[] {
        const hint2result = this.findCommonItem(recipes);
        return [
            `This recipe requires minimum ${this.countRequiredSlots(this.templateRecipe)} slots.`,
            hint2result ? `At least 1 material is shared with this recipe: ${hint2result}` : `Materials used in this recipe are not included in any other recipe!`,
            `Random material from this recipe: ${this.selectRandomMaterial()}`,
            `The item you need to think about is ${this.templateRecipe.name}`
        ]
    }

    private countRequiredSlots(recipe: any): number {
        if (recipe.shapeless) {
            return recipe.required.length;
        }
        return recipe.recipe.filter(Boolean).length;
    }

    private findCommonItem(recipes): string | null {
        let foundRecipe: string | null = null;

        for (const groupName of shuffleArray(Object.keys(recipes))) {
            if (groupName === this.recipeGroup) continue;

            for (const recipe of recipes[groupName]) {
                for (const mat in this.templateRecipe.required) {
                    if (this.recipeMatchesTemplate(recipe, mat)) {
                        foundRecipe = recipe.name;
                        break;
                    }
                }
            }

            if (foundRecipe) break;
        }

        return foundRecipe;
    }

    private recipeMatchesTemplate(recipe: any, material: string): boolean {
        if (recipe.shapeless) {
            return recipe.required.some(element => this.matchesMaterial(element, material));
        }

        return recipe.recipe.some(row => row.some(element => this.matchesMaterial(element, material)));
    }

    private matchesMaterial(element: any, material: string): boolean {
        if (Array.isArray(element)) {
            return element.some(subElement => subElement === material);
        }
        return element === material;
    }

    private selectRandomMaterial() {
        return this.templateRecipe.required[Math.floor(Math.random() * this.templateRecipe.required.length)];
    }

    toJSON() {
        return {
            items: this.inventory,
            recipes: this.recipesService.convertRecipes(this.cacheService.getCachedData('recipes')),
            tips: this.tips,
            hints: this.hints? this.hints.map((hint, index) => ((index+1) * 5 <= this.numberOfGuesses ? hint : null)) : this.hints,
            hearts: Number(this.gamemode) === 7 ? 10 : null,
            result: this.solved
        };
    }
}