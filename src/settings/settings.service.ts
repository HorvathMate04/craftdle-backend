import { HttpException, HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ISettings } from './interfaces/ISettings.interface';
import { UpdateSettingsDto } from './dtos/settingsData.dto';
import { TokenService } from 'src/token/token.service';

@Injectable()
export class SettingsService {

    constructor(
        private readonly prisma: PrismaService,
        private readonly tokenService: TokenService
    ) { }

    //######################################################### QUERY FUNCTIONS #########################################################

    /**
     * A felhasználó beállításainak összegyűjtése.
     * @param {string} authHeader - Az Authorization fejléc tartalma.
     * @returns {Promise<ISettings[]>} - A felhasználó beállításainak listája.
     * @throws {HttpException} - Ha hiba történik az azonosítás vagy adatlekérdezés során.
     */
    async collectSettings(authHeader: string): Promise<ISettings[]> {
        try {
            // Felhasználó azonosítása Bearer token alapján
            const userId = (await this.tokenService.validateBearerToken(authHeader, this.prisma)).id;

            // Beállítások lekérdezése
            return this.gatherSettings(userId);
        } catch (error) {
            throw new HttpException(error.message || 'Internal Server Error', HttpStatus.UNAUTHORIZED);
        }
    }

    /**
     * A felhasználó beállításainak lekérdezése és transzformálása.
     * @param {number} userId - A felhasználó egyedi azonosítója.
     * @param {PrismaService} prisma - A Prisma ORM példánya az adatbázis műveletekhez.
     * @returns {Promise<ISettings[]>} - A transzformált beállítások listája.
     * @throws {Error} - Ha nem található beállítás a felhasználóhoz.
     */
    async gatherSettings(userId: number): Promise<ISettings[]> {
        // Lekérdezzük a beállításokat, beleértve a vezérlési adatokat és a táblázati kiosztásokat
        const settingsRecords = await this.settingsQuery(userId);

        if (!settingsRecords || settingsRecords.length === 0) {
            throw new Error('Settings not found for this user.');
        }

        // Transzformáljuk a beállításokat
        return settingsRecords.map((settings) => {
            const control = settings.controls_controls_settingsTosettings;

            // Alapértelmezett táblázati kiosztás
            const defaultTableMapping: [string, string, string, string, string, string, string, string, string] = [
                "1", "2", "3", "4", "5", "6", "7", "8", "9",
            ];

            // Táblázati kiosztás betöltése vagy alapérték használata
            const tableMapping: [string, string, string, string, string, string, string, string, string] =
                control?.table_mappings?.map((mapping) => mapping.hot_key).slice(0, 9) as [string, string, string, string, string, string, string, string, string] || defaultTableMapping;

            return {
                id: settings.id,
                volume: settings.volume,
                imagesSize: settings.image_size,
                isSet: settings.is_set,
                controls: {
                    isTapMode: control?.is_tap_mode ?? false,
                    copy: control?.copy ?? "LMB",
                    remove: control?.remove ?? "RMB",
                    tableMapping,
                },
            };
        });
    }

    /**
     * Lekérdezés a beállítások és kapcsolódó táblák adatainak betöltéséhez.
     * @param {number} userId - A felhasználó egyedi azonosítója.
     * @param {PrismaService} prisma - A Prisma ORM példánya az adatbázis műveletekhez.
     * @returns {Promise<any[]>} - A lekérdezett nyers adatok.
     */
    async settingsQuery(userId: number) {
        return await this.prisma.settings.findMany({
            where: { user: userId },
            include: {
                controls_controls_settingsTosettings: {
                    include: {
                        table_mappings: true, // Táblázati kiosztások betöltése
                    },
                },
            },
        });
    }

    /**
     * Egy adott beállítás rekordjának lekérése a felhasználó azonosítója alapján.
     * @param {number} settingsId - A keresett beállítás egyedi azonosítója.
     * @param {number} userId - A felhasználó egyedi azonosítója.
     * @returns {Promise<any>} - A lekérdezett beállítás rekord, vagy null, ha nem található.
     */
        async getSettings(settingsId: number, userId: number) {
            const result = await this.prisma.settings.findFirst({
                where: {
                    id: settingsId,
                    user: userId,
                },
            });
    
            return result;
        }

    //######################################################### CREATION FUNCTIONS #########################################################

    /**
     * Létrehozza az alapértelmezett beállításokat egy felhasználó számára.
     * @param prisma PrismaService példa.
     * @param userId A felhasználó azonosítója.
     */
    async createDefaultSettings(userId: number) {
        await this.prisma.$transaction(async (tx) => {
            // Settings generálása
            const settingsRecords = await this.generateRecords(tx.settings, [0, 1, 2], (isSetIndex) => ({
                user: userId,
                volume: 50,
                image_size: 50,
                is_set: isSetIndex === 0,
            }));

            // Controls generálása
            const controlsRecords = await this.generateRecords(tx.controls, settingsRecords, (settings) => ({
                settings: settings.id,
                copy: "LMB",
                remove: "RMB",
                is_tap_mode: false,
            }));

            // TableMappings generálása
            await this.generateRecords(
                tx.table_mappings,
                controlsRecords.flatMap((control) =>
                    Array.from({ length: 9 }, (_, index) => ({
                        control: control.id,
                        slot: index,
                        hot_key: (index + 1).toString(),
                    }))
                ),
                (mappingData) => mappingData
            );
        });
    }

    /**
     * Általános rekord generáló függvény.
     * @param model Prisma modell referencia.
     * @param source Adatok a generáláshoz (tömb vagy egyedi elemek).
     * @param mapper Térkép, amely a forrást adatokká alakítja.
     * @returns A létrehozott rekordok, amelyek tartalmazzák az `id` mezőt.
     */
    async generateRecords<T, R>(
        model: any,
        source: T[],
        mapper: (item: T) => R
    ): Promise<Array<R & { id: number }>> {
        return Promise.all(
            source.map(async (item) => {
                const createdRecord = await model.create({ data: mapper(item) });
                return createdRecord; // A Prisma automatikusan tartalmazza az `id` mezőt.
            })
        );
    }

    //######################################################### MODIFICATION FUNCTIONS #########################################################

    /**
     * Beállítások és hozzájuk tartozó kapcsolódó adatok frissítése.
     * @param {number} settingsId - A módosítandó beállítás egyedi azonosítója.
     * @param {number} userId - A felhasználó egyedi azonosítója.
     * @param {UpdateSettingsDto} settingsData - Az új beállításokat tartalmazó adatok.
     * @param {PrismaService} prisma - A Prisma ORM példánya az adatbázis műveletekhez.
     * @throws {NotFoundException} - Ha a beállítások nem találhatók.
     */
    async modifySettings(settingsId: number, authHeader: string, settingsData: UpdateSettingsDto) {
        const userId = (await this.tokenService.validateBearerToken(authHeader, this.prisma)).id;

        const settings = this.getSettings(settingsId, userId);

        if (!settings) {
            throw new NotFoundException('Settings not found');
        }

        this.updateSettings(settingsId, settingsData);
        const updatedControlsId = (await this.updateControls(settingsId, settingsData)).id;
        this.updateTableMappings(updatedControlsId, settingsData);
    }

    /**
     * A Settings rekord frissítése az adatbázisban.
     * @param {number} settingsId - A módosítandó beállítás azonosítója.
     * @param {UpdateSettingsDto} settingsData - Az új beállításokat tartalmazó adatok.
     */
    async updateSettings(settingsId: number, settingsData: UpdateSettingsDto) {
        await this.prisma.settings.update({
            where: { id: settingsId },
            data: {
                volume: settingsData.volume,
                image_size: settingsData.imagesSize,
                is_set: settingsData.isSet,
            },
        });
    }

    /**
     * Controls rekord frissítése egy adott beállításhoz.
     * @param {number} settingsId - A beállítás azonosítója.
     * @param {UpdateSettingsDto} settingsData - Az új beállításokat tartalmazó adatok.
     * @returns {Promise<any>} - A frissített Controls rekord.
     */
    async updateControls(settingsId: number, settingsData: UpdateSettingsDto) {
        const result = await this.prisma.controls.update({
            where: { settings: settingsId },
            data: {
                is_tap_mode: settingsData.controls.isTapMode,
                copy: settingsData.controls.copy,
                remove: settingsData.controls.remove,
            },
        });

        return result;
    }

    /**
     * TableMappings rekordok frissítése egy adott Controls rekordhoz.
     * @param {number} updatedControlsId - A frissített Controls rekord azonosítója.
     * @param {UpdateSettingsDto} settingsData - Az új beállításokat tartalmazó adatok.
     * @param {PrismaService} prisma - A Prisma ORM példánya az adatbázis műveletekhez.
     */
    updateTableMappings(updatedControlsId: number, settingsData: UpdateSettingsDto) {
        settingsData.controls.tableMapping.map(async (hotKey, index) =>
            this.prisma.table_mappings.updateMany({
                where: {
                    control: updatedControlsId,
                    slot: index,
                },
                data: { hot_key: hotKey },
            }),
        );
    }
}
