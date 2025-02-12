interface IbaseRecipeData {
    id: string;
    name: string;
    shapeless: boolean;
    src: string;
    enabledGamemodes: number[];
}

export interface IShapedRecipe extends IbaseRecipeData {
    recipe: Array<string[] | null>;
}

export interface IShapelessRecipe extends IbaseRecipeData {
    recipe: {optional?: string[], required: string[]};
}