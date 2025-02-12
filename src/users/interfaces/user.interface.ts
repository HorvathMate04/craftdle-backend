import { IAsset } from "src/assets/interfaces/assets.interface";

export interface IUserData{
    loginToken: string;
    username: string;
    profilePicture: IAsset;
    profileBorder: IAsset;
    stayLoggedIn: boolean;
    isGuest: boolean
}

export interface IUser extends IUserData{
    id:number;
}