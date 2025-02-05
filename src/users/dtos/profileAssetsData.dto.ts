import { IsDefined, IsNumber } from "class-validator";

export class ProfileAssetsDataDto {
    @IsDefined()
    @IsNumber()
    profilePicture: number;

    @IsDefined()
    @IsNumber()
    profileBorder: number;
}