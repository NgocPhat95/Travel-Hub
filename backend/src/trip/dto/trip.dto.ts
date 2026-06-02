import { IsNotEmpty, IsString, IsOptional, IsDateString, IsInt, Min, IsArray, ValidateNested, IsEmail, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { CollaboratorRole } from '@prisma/client';

export class CreateTripDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNotEmpty()
  @IsDateString()
  startDate: string;

  @IsNotEmpty()
  @IsDateString()
  endDate: string;
}

export class AddTripItemDto {
  @IsNotEmpty()
  @IsString()
  placeId: string;

  @IsNotEmpty()
  @IsInt()
  @Min(1)
  dayNumber: number;

  @IsNotEmpty()
  @IsInt()
  @Min(0)
  sequenceOrder: number;

  @IsOptional()
  @IsString()
  note?: string;
}

class ReorderItemDto {
  @IsNotEmpty()
  @IsString()
  id: string;

  @IsNotEmpty()
  @IsInt()
  @Min(1)
  dayNumber: number;

  @IsNotEmpty()
  @IsInt()
  @Min(0)
  sequenceOrder: number;
}

export class ReorderTripItemsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReorderItemDto)
  items: ReorderItemDto[];
}

export class AddCollaboratorDto {
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsEnum(CollaboratorRole)
  role: CollaboratorRole;
}
