import { Injectable, UnauthorizedException, HttpException, HttpStatus } from '@nestjs/common';
import * as crypto from 'crypto';
import * as dotenv from 'dotenv';
import { PrismaService } from 'src/prisma/prisma.service';
import { v4 as uuidv4 } from 'uuid';

dotenv.config();

@Injectable()
export class TokenService {

    private readonly ENCRYPTION_KEY: Buffer;

    constructor(
        private readonly prisma: PrismaService
    ) {
        // Az ENCRYPTION_KEY csak egyszer, a konstruktorban kerül betöltésre
        this.ENCRYPTION_KEY = Buffer.from(process.env.ENCRYPTION_KEY!, 'hex');
    }

    //######################################################### TOKEN CRUD FUNCTIONS #########################################################

    /**
     * Token létrehozása, biztosítva, hogy egyedi legyen az adatbázisban.
     * Ha a generált token már létezik, újratér.
     * @returns Új generált token.
     */
    async createToken(): Promise<string> {
        let token: string = uuidv4();

        // Ellenőrizzük, hogy a generált token már létezik-e az adatbázisban
        while (await this.validateToken(token, true)) {
            // Ha létezik, újat generálunk
            token = uuidv4();
        }

        // Visszaadjuk az új, egyedi tokent
        return token;
    }

    /**
     * Token törlése az adatbázisból egy adott felhasználóhoz.
     * Ez a függvény csak a tokent törli, a felhasználói adatok érintetlenek maradnak.
     * @param userId - A felhasználó azonosítója, akinek a tokene törlésre kerül.
     * @returns Boolean érték, amely jelzi, hogy sikeres volt-e a törlés.
     */
    async deleteToken(userId: number): Promise<boolean> {
        try {
            const deletedToken = await this.prisma.tokens.delete({
                where: { user: userId },
            });

            return !!deletedToken; // Sikeres törlés esetén `true`
        } catch (error) {
            console.error('Token törlése sikertelen:', error.message);
            return false; // Hibás törlés esetén `false`
        }
    }

        /**
     * Tokens lekérése felhasználói ID alapján.
     * @param userId - A felhasználó azonosítója.
     * @returns A felhasználóhoz tartozó összes token.
     * @throws HttpException - Ha a lekérés nem sikerült.
     */
        async getTokensByUserId(userId: number) {
            try {
                return await this.prisma.tokens.findMany({ where: { user: userId } });
            } catch (error) {
                throw new HttpException('Tokenek lekérése sikertelen.', HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }

        /**
     * Token párosítása a megadott felhasználóhoz az adatbázisban.
     * Biztosítja, hogy egy felhasználónak csak egy tokenje lehet.
     * @param userId - A felhasználó azonosítója, akihez a tokent párosítani kell.
     * @param token - A generált belépési token.
     * @param isExpire - Megadja, hogy a token átmeneti vagy állandó.
     */
    async pairTokenWithUser(
        userId: number,
        token: string,
        isExpire: boolean
    ): Promise<void> {
        try {
            // Ellenőrizzük, hogy van-e már meglévő token a felhasználónál
            const existingToken = await this.prisma.tokens.findFirst({
                where: { user: userId },
            });

            if (existingToken) { // Ha van már tokenje, töröljük a tokent az adatbázisból
                await this.prisma.tokens.delete({
                    where: { user: userId },
                });
            }

            // Új token párosítása a felhasználóhoz
            await this.prisma.tokens.create({
                data: {
                    user: userId,
                    login_token: this.encryptUuid(token),
                    is_expire: isExpire,
                },
            });
        } catch (error) {
            console.error('Token párosítása nem sikerült:', error);
            throw new Error('Adatbázis hiba: Token párosítása nem sikerült.');
        }
    }

    //######################################################### TOKEN VALIDATION FUNCTIONS #########################################################

    /**
     * Alap (Basic Auth) token validálása.
     * A token a következő formátumban érkezik: `Basic <base64(username:token)>`.
     * A függvény a `username` és a hozzá tartozó `token` alapján azonosítja a felhasználót.
     * @param authorization - Az `authorization` fejléc tartalma (Basic token).
     * @returns Az érvényes tokenhez tartozó felhasználó adatai.
     * @throws UnauthorizedException, ha a token érvénytelen vagy hiányzik.
     */
    async validateBasicToken(authorization: string) {
        if (!authorization || !authorization.startsWith('Basic ')) {
            throw new UnauthorizedException('Az Authorization fejléc hiányzik vagy érvénytelen.');
        }

        // Alap dekódolás: a "Basic" prefix eltávolítása és base64 dekódolás
        const base64Credentials = authorization.split(' ')[1];
        const credentials = Buffer.from(base64Credentials, 'base64').toString('utf-8');
        const [username, token] = credentials.split(':');

        if (!username || !token) {
            throw new UnauthorizedException('Az Authorization fejlécben hiányosak a hitelesítési adatok.');
        }

        // Token validálása
        const user = await this.validateToken(token);
        if (!user) {
            throw new HttpException('Érvénytelen token.', HttpStatus.UNAUTHORIZED);
        }

        return user;
    }

    /**
     * Bearer token validálása.
     * @param authorization - Az `authorization` header tartalma.
     * @param forUserLogin - Flag, amely jelzi, hogy bejelentkezéskor fut-e.
     * @returns Az érvényes tokenhez tartozó felhasználó adatai vagy `null` a bejelentkezésnél.
     */
    async validateBearerToken(authorization: string, forUserLogin: boolean = false) {
        if (!authorization) {
            if (forUserLogin) {
                return null; // Ha a bejelentkezési folyamat része, nem dob hibát
            }
            throw new UnauthorizedException("Token nem található.");
        }

        const token = authorization.replace('Bearer ', ''); // Bearer prefix eltávolítása
        if (!token) {
            throw new UnauthorizedException('Token hiányzik.');
        }

        const user = await this.validateToken(token);
        if (!user) {
            throw new HttpException('Érvénytelen token.', HttpStatus.UNAUTHORIZED);
        }
        return user;
    }

    /**
     * Token validálása az adatbázisban.
     * @param token - A validálandó token.
     * @param forUuidGeneration - Ha igaz, akkor nem dobunk hibát, ha nem található token.
     * @returns A felhasználó, akihez a token tartozik, vagy `null` ha érvénytelen.
     * @throws UnauthorizedException - Ha a token nem található.
     */
    async validateToken(token: string, forUuidGeneration: boolean = false) {
        const tokenQuery = await this.prisma.tokens.findFirst({
            where: { login_token: this.encryptUuid(token) }
        });

        if (!tokenQuery) {
            if (forUuidGeneration) {
                return null;  // Ha UUID generálunk, nem dobunk hibát, csak null-t adunk vissza
            }
            throw new UnauthorizedException('Token not found.');
        }

        return tokenQuery.user;
    }

    //######################################################### TOKEN ENCRYPT&DECODE FUNCTIONS #########################################################

    /**
     * IV (Initialization Vector) lekérése UUID-ból AES titkosításhoz.
     * @param uuid - Az UUID, amelyből az IV-t generáljuk.
     * @returns 16 bájtos IV.
     */
    getIVFromUuid(uuid: string): Buffer {
        return crypto.createHash('sha256').update(uuid).digest().slice(0, 16);
    }

    /**
     * UUID titkosítása AES-256-CBC algoritmus használatával.
     * @param uuid - Az UUID, amelyet titkosítunk.
     * @returns Titkosított UUID.
     */
    encryptUuid(uuid: string): string {
        const iv = this.getIVFromUuid(uuid);
        const cipher = crypto.createCipheriv('aes-256-cbc', this.ENCRYPTION_KEY, iv);
        let encrypted = cipher.update(uuid, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        return encrypted;
    }

    /**
     * Titkosított UUID visszafejtése.
     * @param encryptedUuid - A titkosított UUID.
     * @param uuid - Az UUID, amelyhez a titkosított adat tartozik.
     * @returns Visszafejtett UUID.
     */
    decryptUuid(encryptedUuid: string, uuid: string): string {
        const iv = this.getIVFromUuid(uuid);
        const decipher = crypto.createDecipheriv('aes-256-cbc', this.ENCRYPTION_KEY, iv);
        let decrypted = decipher.update(encryptedUuid, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    }
}
