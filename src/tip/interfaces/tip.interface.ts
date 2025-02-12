import { IItem } from "src/sharedComponents/interfaces/item.interface";

export interface ICheckedTip{
    item: IItem
    table: Array<{item: string, status: string}>
    date: Date;
}

export interface ITip {
    item: {group: string, id: string};
    table: Array<Array<string> | null>;
}