import { IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class GetPlacesDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number = 10;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  offset?: number = 0;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  sortBy?: 'rating' | 'popularity' | 'name' = 'rating';
}

export class CreateQuestionDto {
  @IsNotEmpty()
  @IsString()
  content: string;
}

export class CreateAnswerDto {
  @IsNotEmpty()
  @IsString()
  content: string;
}

export class SuggestEditDto {
  @IsNotEmpty()
  proposedData: any;
}
