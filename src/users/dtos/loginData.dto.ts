import { IsString, IsNotEmpty, IsBoolean, IsOptional } from 'class-validator';

//DTO a frontendtől érkező login adatok validálására
export class LoginDataDto {
    @IsOptional()
    @IsString()
    @IsNotEmpty()
    usernameOrEmail: string;

    @IsOptional()
    @IsString()
    @IsNotEmpty()
    password: string;

    @IsOptional()
    @IsBoolean()
    stayLoggedIn: boolean;
}