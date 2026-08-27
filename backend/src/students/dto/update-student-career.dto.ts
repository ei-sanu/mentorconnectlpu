import { IsString, IsArray, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateStudentCareerDto {
  @ApiPropertyOptional()
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  careerGoals?: string[];

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  targetRole?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  targetIndustry?: string;

  @ApiPropertyOptional()
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  currentSkills?: string[];
}
