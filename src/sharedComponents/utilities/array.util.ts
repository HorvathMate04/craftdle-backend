export function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    };
    return array;
};

export function createMatrixFromArray(array: Array<Array<string> | null>) {
    let matrix = [];
    let row = [];
    array.forEach((item, index) => {
        row.push(item);

        if ((index + 1) % 3 === 0 || index === array.length - 1) {
            if (row.length != 3) {
                for (let i = row.length; i < 3; i++) {
                    row.push(null)
                }
            }
            matrix.push(row);
            row = [];
        }
    });
    return matrix;
}

export function mergeMatrixRows(
    structure: Array<Array<Array<string> | null>>
): Array<Array<string> | null> {
    return structure.flatMap(outerArray => outerArray);
}
