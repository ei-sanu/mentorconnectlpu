import { IsString, IsInt, IsOptional, IsArray, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateMentorProfileDto {
  @ApiPropertyOptional()
  @IsInt()
  @IsOptional()
  graduationYear?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  programme?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  currentCompany?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  currentDesignation?: string;

  @ApiPropertyOptional()
  @IsInt()
  @IsOptional()
  yearsOfExperience?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  industry?: string;

  @ApiPropertyOptional()
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  expertise?: string[];

  @ApiPropertyOptional()
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  mentoringAreas?: string[];

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  bio?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  careerSummary?: string;

  @ApiPropertyOptional()
  @IsInt()
  @IsOptional()
  maxCapacity?: number;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  acceptingMentees?: boolean;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  profileVisibility?: boolean;
}
