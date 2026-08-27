import { IsString, IsOptional, IsInt, IsBoolean, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class MentorQueryDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  skills?: string; // Comma separated list of skills

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  industry?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  role?: string; // target role / currentDesignation

  @ApiPropertyOptional()
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  experienceMin?: number;

  @ApiPropertyOptional()
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  experienceMax?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  availability?: string; // Saturday, Sunday, etc.

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  acceptingMentees?: boolean;

  @ApiPropertyOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  limit?: number = 10;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  sort?: string = 'experienceYears_desc'; // experienceYears_desc, experienceYears_asc, etc.
}
