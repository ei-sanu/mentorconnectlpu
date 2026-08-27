import { IsString, IsNotEmpty, IsDateString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateActionItemDto {
  @ApiProperty({ description: 'The task description' })
  @IsString()
  @IsNotEmpty()
  task: string;

  @ApiProperty({ description: 'User ID of the assigned person' })
  @IsString()
  @IsNotEmpty()
  assignedToId: string;

  @ApiProperty({ description: 'Due date for this action item' })
  @IsDateString()
  @IsNotEmpty()
  dueDate: string;

  @ApiPropertyOptional({ description: 'Optional goal ID to associate with this action item' })
  @IsString()
  @IsOptional()
  goalId?: string;
}
