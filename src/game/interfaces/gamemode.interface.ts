interface IBaseGamemode{
    id: number;
    icon: string;
    name: string;
    description: string;
};

interface IDifficulty{
    id: number;
    name: string;
    color: string;
};

export interface IGamemode extends IBaseGamemode {
    difficulty: Omit<IDifficulty, 'id'>;
    continueGame: boolean;
}

export interface IGamemodeWithDifficulties extends IBaseGamemode{
    difficulties: IDifficulty;
};