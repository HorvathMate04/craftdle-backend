import { IAccessory } from "../../assets/interfaces/IAsset.interface";

export interface IUserData{
    loginToken: string;
    username: string;
    profilePicture: IAccessory;
    profileBorder: IAccessory;
    stayLoggedIn: boolean;
    isGuest: boolean
}

export interface IUser extends IUserData{
    id:number;
}