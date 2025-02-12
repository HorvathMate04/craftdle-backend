import { getCurrentDate } from 'src/sharedComponents/utilities/date.util';
import { PrismaService } from '../../prisma/prisma.service';
import { IUser } from '../interfaces/user.interface';
import * as bcrypt from 'bcrypt';
import { TokenService } from 'src/token/token.service';
import { Injectable } from '@nestjs/common';

Injectable()
export class AccountUtilities {

    constructor(
        private readonly tokenService: TokenService
    ) {}

    async createAccount(
        prisma: PrismaService,
        accountData?: { username?: string; email?: string; password?: string; stayLoggedIn?: boolean }
    ): Promise<IUser> {
        try {
            // Döntés: vendég vagy normál felhasználó
            const isGuest = !accountData || !accountData.username || !accountData.email || !accountData.password;
    
            let userData;
    
            if (isGuest) {
                // Vendég felhasználó adatai
                userData = { 
                    is_guest: true,
                    registration_date: getCurrentDate(),
                };
            } else {
                // Normál felhasználó adatai
                const hashedPassword = await bcrypt.hash(accountData.password, 2); // Jelszó hashelése
                userData = {
                    username: accountData.username,
                    email: accountData.email,
                    password: hashedPassword,
                    is_guest: false,
                    registration_date: getCurrentDate(),
                };
            }
    
            // Felhasználó létrehozása
            const createdUser = await prisma.users.create({
                data: userData
            });
    
            await prisma.users_profile_pictures.create({
                data: {
                    user: createdUser.id,
                    profile_picture: 15,
                    is_set: true
                }
            })
    
            await prisma.users_profile_borders.create({
                data: {
                    user: createdUser.id,
                    profile_border: 7,
                    is_set: true
                }
            })
    
            // Törzsadatok generálása
            return {
                id: createdUser.id,
                loginToken: await this.tokenService.createToken(),
                username: isGuest ? `Guest${createdUser.id}` : createdUser.username,
                profilePicture: {
                    id: 15,
                    name: "Desert Villager Base",
                    src: "Desert_Villager_Base.png"
                },
                isGuest: isGuest,
                profileBorder: {
                    id: 7,
                    name: "Grass",
                    src: "Grass.png"
                },
                stayLoggedIn: isGuest ? false : !!accountData?.stayLoggedIn,
            };
        } catch (error) {
            console.error("Error creating account:", error);
            throw new Error("Failed to create account.");
        }
    }
}