export interface ICheckedMatrixResponse {
    solved: boolean;
    result: Array<{item: string, status: string} | null>;
    matches: number;
}