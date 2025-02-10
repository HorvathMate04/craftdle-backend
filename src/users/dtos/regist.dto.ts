import { IsString, IsEmail, IsBoolean, Length, Matches, IsNotEmpty } from 'class-validator';

export class RegistDataDto {
    @IsString()
    @IsNotEmpty({ message: 'Username is required.' })
    @Length(5, 16, { message: 'Username must be between 5 and 16 characters.' })
    @Matches(/^[A-Za-z0-9.,;:$#!/?%&()]+$/, {
        message: 'Username contains invalid characters.',
    })
    username: string;

    @IsEmail({}, { message: 'Invalid email address.' })
    @IsNotEmpty({ message: 'Email is required.' })
    email: string;

    @IsString()
    @IsNotEmpty({ message: 'Password is required.' })
    @Length(5, 16, { message: 'Password must be between 5 and 16 characters.' })
    password: string;

    @IsBoolean()
    @IsNotEmpty({ message: 'StayLoggedIn flag is required.' })
    stayLoggedIn: boolean;
}
