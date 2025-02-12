import { PartialType } from '@nestjs/mapped-types';
import { CreateAdminDto } from './createAdmin.dto';

export class UpdateAdminDto extends PartialType(CreateAdminDto) {}
