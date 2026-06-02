import { IsNotEmpty, IsNumber, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateReviewDto {
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(5)
  ratingOverall: number;

  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(5)
  ratingCleanliness: number;

  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(5)
  ratingService: number;

  @IsNotEmpty()
  @IsString()
  title: string;

  @IsNotEmpty()
  @IsString()
  content: string;
}
