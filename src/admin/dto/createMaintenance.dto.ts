import { Type } from "class-transformer";
import { IsDate, IsDefined, IsNotEmpty } from "class-validator";

export class CreateMaintenanceDto {
    @IsDefined()
    @IsNotEmpty()
    @Type(() => Date)
    @IsDate()
    start: Date

    @IsDefined()
    @IsNotEmpty()
    @Type(() => Date)
    @IsDate()
    end: Date
}