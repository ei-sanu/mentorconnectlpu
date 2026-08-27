import { IsString, IsNotEmpty, IsDateString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSessionDto {
  @ApiProperty({ description: 'The title or topic of the session' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ description: 'Start time of the session' })
  @IsDateString()
  @IsNotEmpty()
  startTime: string;

  @ApiProperty({ description: 'End time of the session' })
  @IsDateString()
  @IsNotEmpty()
  endTime: string;

  @ApiPropertyOptional({ default: 'Asia/Kolkata' })
  @IsString()
  @IsOptional()
  timezone?: string = 'Asia/Kolkata';

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notes?: string;
}
