import {
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { Type } from 'class-transformer';

export class AdminLoginDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}

export class ListTenantsQueryDto {
  @IsOptional()
  @Type(() => Number)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  limit?: number = 20;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  status?: string;
}

export class UpdateTenantStatusDto {
  @IsIn(['active', 'suspended'])
  status: 'active' | 'suspended';
}

export class UpdateTenantPlanDto {
  @IsUUID()
  planId: string;
}

export class UpdatePlatformSettingsDto {
  @IsString()
  @IsNotEmpty()
  key: string;

  value: any;
}
