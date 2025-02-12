import readline from 'node:readline';
import { promises as fs } from 'fs';
import path from 'path';

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

async function getFilePath() {
    return new Promise((resolve) => {
        rl.question("Path to the file: ", (filePath) => {
            rl.close();
            resolve(filePath.trim());
        });
    });
};

async function fetchJSONFile(src) {
    try {
        const absolutePath = path.resolve(src);
        const data = await fs.readFile(absolutePath, 'utf-8');
        return JSON.parse(data);
    } catch (err) {
        console.error("Error reading or parsing the file:", err.message);
        throw err;
    }
};

async function writeJSONToFile(src, data) {
    try {
        const absolutePath = path.resolve(src);
        const jsonData = JSON.stringify({ data }, null, 2);
        await fs.writeFile(absolutePath, jsonData, 'utf-8');
        console.log("File successfully updated.");
    } catch (err) {
        console.error("Error writing to the file:", err.message);
        throw err;
    }
};

function isValidMaterial(material) {
    return material !== null && material !== undefined;
}

function processMaterials(materials, callback) {
    let result = [];
    materials.forEach(material => {
        if (isValidMaterial(material)) {
            if (Array.isArray(material)) {
                result.push(material[Math.floor(Math.random() * material.length)]);
            } else {
                result.push(material);
            }
        }
    });
    return callback ? callback(result) : result;
}

function addMaterialsToSet(set, mats) {
    const processedMaterials = processMaterials(mats);
    processedMaterials.forEach(mat => set.add(mat));
    return set;
}

function getMaterialsForRecipe(recipe) {
    return recipe.shapeless
        ? recipe.recipe.required
        : processMaterials(recipe.recipe);
}

function checkForSameMaterial(set, mats) {
    return mats.some(mat =>
        Array.isArray(mat)
            ? mat.some(element => set.has(element))
            : set.has(mat)
    );
}

function collectMaterialsForGraph(materials, recipes) {
    let graph = new Set(materials);
    let elementAdded = true;
    while (elementAdded && graph.size < 20) {
        elementAdded = false;
        Object.keys(recipes).forEach(group => {
            recipes[group].forEach(recipe => {
                const mats = recipe.shapeless ? recipe.recipe.required : recipe.recipe;
                if (checkForSameMaterial(graph, mats)) {
                    let tempGraph = addMaterialsToSet(graph, mats);
                    if (tempGraph.size > graph.size) {
                        elementAdded = true;
                    }
                    graph = tempGraph;
                }
            });
        });
    }
    return graph.size >= 20;
}

function converRecipeGridToMatrix(grid) {
    const matrix = [];
    for (let i = 0; i < grid.length; i += 3) {
        matrix.push(grid.slice(i, i + 3));
    }
    return matrix;
}

function checkRightGridSizeOfRecipe(recipe) {
    if (recipe.shapeless) {
        return recipe.recipe.required.length <= 4;
    }
    const matrix = converRecipeGridToMatrix(recipe.recipe);
    return matrix.length < 3 && matrix.every(row => row.length < 3);
}

function geatherDataAboutRecipe(recipes, recipe) {
    const materialsOfRecipe = getMaterialsForRecipe(recipe);
    const hasGraphScore20 = collectMaterialsForGraph(materialsOfRecipe, recipes);
    const validMatrixForPocketMode = checkRightGridSizeOfRecipe(recipe);
    const hasMoreThanOneTypeOfMaterial = new Set(materialsOfRecipe).size > 1;
    const isSelfCraftRecipe = materialsOfRecipe.includes(recipe.id);

    const enabledGamemodesForRecipe = [4];
    if (hasMoreThanOneTypeOfMaterial && !isSelfCraftRecipe) {
        enabledGamemodesForRecipe.push(2, 3, 7);
        if (hasGraphScore20) {
            enabledGamemodesForRecipe.push(6);
        }
        if (validMatrixForPocketMode) {
            enabledGamemodesForRecipe.push(5);
        }
    }
    console.log(enabledGamemodesForRecipe)
    return enabledGamemodesForRecipe;
}

function convertDictToValidArray(dict) {
    const maxIndex = Math.max(...Object.keys(dict).map(Number));
    return Array.from({ length: maxIndex + 1 }, (_, i) => dict[i.toString()] || null);
}

function convertCellsToList(recipe) {
    let result = [];
    console.log(recipe)
    recipe.forEach(element => {
        let cell = element && !Array.isArray(element) ? [element] : element;
        result.push(cell);
    });
    return result;
}

function analyzeRecipes(data) {
    Object.keys(data).forEach(group => {
        const availableGamemodes = geatherDataAboutRecipe(data, data[group][0]);
        data[group].forEach(recipe => {
            recipe["enabledGamemodes"] = availableGamemodes;
        });
    });
    return data;
}

function convertEveryRecipeToArray(data) {
    Object.keys(data).forEach(group => {
        data[group].forEach(recipe => {
            if(!recipe.shapeless){
                if(!Array.isArray(recipe.recipe)){
                    recipe.recipe = convertDictToValidArray(recipe.recipe);
                };
                recipe.recipe = convertCellsToList(recipe.recipe);
                console.log(recipe.recipe)
            };
        });
    });
    return data;
}

async function main() {
    const filePath = "./recipes.json";
    let recipes = await fetchJSONFile(filePath);
    recipes = convertEveryRecipeToArray(recipes.data);
    const analyzedData = analyzeRecipes(recipes);
    await writeJSONToFile(filePath, analyzedData);
}

main();