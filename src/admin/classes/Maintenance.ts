import { PrismaService } from "src/prisma/prisma.service";
import { CreateMaintenanceDto } from "../dto/createMaintenance.dto";
import { Injectable } from "@nestjs/common";
import { getCurrentDate } from "src/sharedComponents/utilities/date.util";

@Injectable()
export class Maintenance {
    constructor(private readonly prisma: PrismaService) { }

    async createMaintenance(createMaintenanceDto: CreateMaintenanceDto) {
        return await this.prisma.maintenance.create({
            data: {
                user: 1,
                ...createMaintenanceDto
            }
        });
    }

    async getUpcomingMaintenance() {
        return this.prisma.maintenance.findFirst({
            where: {
                end: { gt: getCurrentDate() },
            },
            orderBy: { start: 'asc' },
        });
    }

    async getCurrentMaintenance() {
        const upcomingMaintenance = await this.getUpcomingMaintenance();
        if (!upcomingMaintenance) {
            return {
                started: false,
                countdown: null
            };
        }

        const now = getCurrentDate();

        const started = upcomingMaintenance.start < now;

        const countdown = Math.round((started ? (
            upcomingMaintenance.end.getTime() - now.getTime()
        ) : (
            upcomingMaintenance.start.getTime() - now.getTime()
        )) / 1000);

        return {
            started: started,
            countdown: countdown > 0 ? countdown : null
        };
    }
}
