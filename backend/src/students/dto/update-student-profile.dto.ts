import { IsString, IsInt, IsOptional, IsArray, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateStudentProfileDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  programme?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  school?: string;

  @ApiPropertyOptional()
  @IsInt()
  @IsOptional()
  yearOfStudy?: number;

  @ApiPropertyOptional()
  @IsInt()
  @IsOptional()
  graduationYear?: number;

  @ApiPropertyOptional()
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  interests?: string[];

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  mentoringNeeds?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  preferredFrequency?: string;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  profileVisibility?: boolean;
}
