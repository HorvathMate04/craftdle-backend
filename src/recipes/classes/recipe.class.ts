import { createMatrixFromArray } from "src/sharedComponents/utilities/array.util";
import { IShapedRecipe, IShapelessRecipe } from "../interfaces/recipe.interface";
import { RecipesService } from "../recipes.service";


export class Recipe {
    name: string;
    id: string;
    shapeless: boolean;
    required: Array<Array<string>>;
    optionalMaterials?: string[] | null;
    recipe?: Array<Array<string[] | null>> | null;
    src: string;
    enabledGamemodes: number[];

    constructor(
        data: IShapedRecipe | IShapelessRecipe,
        private readonly recipesService: RecipesService
    ) {
        this.name = data.name;
        this.id = data.id;
        this.shapeless = data.shapeless;
        this.required = this.recipesService.collectMaterials(data);
        this.optionalMaterials = this.recipesService.isShapelessRecipeData(data) && data.recipe.optional ? data.recipe.optional : null;
        this.recipe = !data.shapeless ? createMatrixFromArray(data.recipe as Array<Array<string>>) : null;
        this.src = data.src;
        this.enabledGamemodes = data.enabledGamemodes;
    }

    private createRecipeObject(){
        if(this.shapeless){
            return {
                required: this.required,
                optional: this.optionalMaterials
            }
        }
        return this.recipe;
    }

    toJSON(){
        return {
            id: this.id,
            name: this.name,
            recipe: this.createRecipeObject(),
            shapeless: this.shapeless,
            src: this.src,
        }
    }
}
