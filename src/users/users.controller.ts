import { Controller, Get, Post, Put, Delete, Body, UnauthorizedException, Param, Headers, HttpException, HttpStatus, Render, Query } from '@nestjs/common';
import { UsersService } from './users.service';
import { ApiResponse } from '../shared/interfaces/APIResponse';
import { LoginDataDto } from './dtos/loginData.dto';
import { RegistDataDto } from './dtos/registData.dto';
import { UpdateSettingsDto } from './dtos/settingsData.dto';
import { ProfileDto } from './dtos/profileAssetsData.dto';
import { EmailService } from 'src/email/email.service';
import { EmailGateway } from 'src/email/email.gateway';
import { SettingsService } from 'src/settings/settings.service';

@Controller('users')
export class UsersController {
    constructor(
        private readonly usersService: UsersService,
        private readonly emailService: EmailService,
        private readonly emailGateway: EmailGateway,
        private readonly settingsService: SettingsService
    ) { }

    //######################################################### USER LOGIN/REGIST ENDPOINTS #########################################################

    /**
     * Regisztrációs végpont, amely új felhasználót hoz létre, vagy hibaüzenetet ad vissza.
     * @param userDto Az új felhasználó adatai (DTO formában).
     * @returns API válasz: siker esetén az új felhasználó adatai, hiba esetén az üzenet.
     */
    @Post('register')
    async register(@Body() userDto: RegistDataDto): Promise<ApiResponse> {
        try {
            const result = await this.usersService.register(userDto);
            if (!('loginToken' in result)) {
                throw new HttpException({ errors: result }, HttpStatus.BAD_REQUEST);
            }
            return { data: result }; 
        } catch (err) {
            throw new HttpException(
                { message: err.response || err.message },
                err.status || HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    /**
     * Guest account létrehozása olyan felhasználók számára, akik nem rendelkeznek állandó fiókkal.
     * @returns {Promise<ApiResponse>} Guest account adatai vagy hibaüzenet.
     */
    @Get('login')
    async createGuestAccount(): Promise<ApiResponse> {
        try {
            const result = await this.usersService.loginWithGuestAccount();
            return { data: result };
        } catch (err) {
            console.error("Hiba történt vendégfiók létrehozásakor:", err.message);
            return { message: err.message };
        }
    }

    /**
     * Bejelentkezési végpont, amely vagy Bearer tokent, vagy felhasználónév/jelszó párost fogad.
     * @param authorization - Az `authorization` header tartalma (opcionális).
     * @param body - A `LoginDataDto` objektum, amely tartalmazza a bejelentkezési adatokat.
     * @returns API válasz: sikeres bejelentkezés esetén a felhasználói adatokkal.
     * @throws UnauthorizedException ha hibás a bejelentkezés.
     */
    @Post('login')
    async login(@Headers('authorization') authorization: string, @Body() body: LoginDataDto) {
        try {
            const result = await this.usersService.loginUser(authorization, body);
            return { data: result }; 
        } catch (err) {
            console.error("Bejelentkezési hiba:", err.message);
            throw new UnauthorizedException();
        }
    }

    /**
     * Kijelentkezési végpont, amely Basic Auth `username:token` alapján validálja a felhasználót.
     * A valid tokennel rendelkező felhasználók tokenje törlésre kerül az adatbázisból.
     * A felhasználó adatai megmaradnak statisztikai célok miatt.
     * @param authHeader - Az `authorization` fejléc tartalma.
     * @returns Üzenet a kijelentkezési folyamat eredményéről.
     */
    @Delete('login')
    async logoutUser(@Headers('authorization') authHeader: string): Promise<ApiResponse> {
        try {
            await this.usersService.logoutUser(authHeader);
            return { message: 'Logout successful' };
        } catch (err) {
            console.error('Logout error:', err.message);
            return { message: err.message };
        }
    }

    //######################################################### SETTINGS ENDPOINTS #########################################################

    /**
     * Felhasználó beállításainak lekérdezése (settings).
     * @param {string} authorization - A Bearer token azonosításhoz az Authorization fejlécben.
     * @returns {Promise<ApiResponse>} - A felhasználó beállításai vagy hibaüzenet.
     */
    @Get('settings')
    async getSettings(@Headers('authorization') authorization: string): Promise<ApiResponse> {
        try {
            const result = await this.settingsService.collectSettings(authorization);
            return { data: result }; 
        } catch (err) {
            return { message: err.message };
        }
    }

    /**
     * A felhasználói beállítások módosítása a beállítás azonosítója és az új adatok alapján.
     * @param {number} settingsId - A módosítandó beállítások egyedi azonosítója.
     * @param {string} authorization - Az autentikációs fejléc, amely tartalmazza a Bearer tokent.
     * @param {UpdateSettingsDto} updateSettingsData - Az új beállításokat tartalmazó adatok.
     * @returns {ApiResponse} - A sikeres művelet után egy üzenetet tartalmazó válasz.
     * @throws {HttpException} - Ha a token érvénytelen, vagy ha valamilyen hiba történik a beállítások módosítása során.
     */
    @Put('settings/:id')
    async updateSettings(@Param('id') settingsId: number, @Headers('authorization') authorization: string, @Body() updateSettingsData: UpdateSettingsDto) {
        try {
            await this.settingsService.modifySettings(settingsId, authorization, updateSettingsData);
            return { message: "Settings successfully changed" }
        } catch (err) {
            return { message: err.message }
        }
    }

    /**
     * A felhasználó gyűjteményének lekérdezése.
     * @param authorization - A Bearer token azonosításhoz.
     * @returns A felhasználó gyűjteménye.
     */
    @Get('collection')
    async getCollection(@Headers('authorization') authorization: string): Promise<ApiResponse> {
        try {
            const result = await this.usersService.getCollection(authorization);
            return { data: result };
        } catch (err) {
            return { message: err.message };
        }
    }

    /**
     * A felhasználó profiljának frissítése.
     * @param authorization - A Bearer token azonosításhoz.
     * @param body - A frissítendő profil adatai.
     * @returns A frissített profil adatai.
     */
    @Put('profile')
    async updateProfile(@Headers('authorization') authorization: string, @Body() body: ProfileDto): Promise<ApiResponse> {
        try {
            const result = await this.usersService.updateProfile(authorization, body);
            return { data: result };
        } catch (err) {
            return { message: err.message };
        }
    }

    /**
     * A felhasználó statisztikáinak lekérdezése.
     * @param authorization - A Bearer token azonosításhoz.
     * @returns A felhasználó statisztikái.
     */
    @Get('stats')
    async getStats(@Headers('authorization') authorization: string): Promise<ApiResponse> {
        try {
            const result = await this.usersService.getStats(authorization)
            return { data: result }
        } catch (err) {
            return { message: err.message }
        }
    }

    /**
     * Jelszó visszaállító kérés küldése a felhasználónak emailben.
     * @param authorization - Az autentikációs token (opcionális).
     * @param body - A felhasználó email címe.
     * @returns A jelszó visszaállítási információ.
     */
    @Post('password')
    async requestPasswordReset(@Headers('authorization') authorization: string, @Body() body: { email: string }): Promise<ApiResponse> {
        try {
            const result = await this.usersService.requestPasswordReset(authorization, body.email);
            const item = result.items.find(image => image.isRight)
            this.emailService.sendVerifyEmail(body.email, { token: result.token, items: result.items });
            return { data: { item: item } };
        } catch (err) {
            return { message: err.message };
        }
    }

    /**
     * Felhasználói ellenőrzés végrehajtása a token és id alapján a jelszó visszaállításához.
     * @param token - A jelszó visszaállító token.
     * @param id - A felhasználó egyedi azonosítója.
     * @returns A sikeres vagy sikertelen ellenőrzés üzenete.
     */
    @Get('userVerify')
    @Render('passwordResetResponse')
    async verifyUser(@Query('token') token: string, @Query('id') id: string) {
        try {
            const result = await this.usersService.verifyUser(token, id);
            this.emailGateway.emitUserVerification(result.userId, result.token, result.success);
            return {
                text: result.text,
                color: result.color
            };
        } catch (err) {
            return { message: err.message };
        }
    }

    /**
     * Jelszó visszaállítása a felhasználó számára.
     * @param authorization - Az autentikációs token.
     * @param body - A jelszó visszaállításához szükséges token és az új jelszó.
     * @returns A sikeres jelszó változtatásról szóló üzenet.
     */
    @Put('password')
    async resetPassword(@Headers('authorization') authorization: string, @Body() body: { token: string, password: string }): Promise<ApiResponse> {
        try {
            console.log("Reset password", body);
            return await this.usersService.resetPassword(authorization, body);
        } catch (err) {
            return { message: err.message };
        }
    }
}