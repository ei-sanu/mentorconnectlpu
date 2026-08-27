import { IsInt, IsString, IsOptional, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateFeedbackDto {
  @ApiProperty({ description: 'Rating score from 1 to 5' })
  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  comments?: string;

  // Student specific feedback fields
  @ApiPropertyOptional({ description: 'How useful the session was (1-5)' })
  @IsInt()
  @Min(1)
  @Max(5)
  @IsOptional()
  usefulness?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  learningOutcome?: string;

  // Mentor specific feedback fields
  @ApiPropertyOptional({ description: 'How prepared the student was (1-5)' })
  @IsInt()
  @Min(1)
  @Max(5)
  @IsOptional()
  preparedness?: number;

  @ApiPropertyOptional({ description: 'How much progress the student has made (1-5)' })
  @IsInt()
  @Min(1)
  @Max(5)
  @IsOptional()
  progressScore?: number;

  @ApiPropertyOptional({ description: 'Student engagement level (1-5)' })
  @IsInt()
  @Min(1)
  @Max(5)
  @IsOptional()
  engagement?: number;
}
