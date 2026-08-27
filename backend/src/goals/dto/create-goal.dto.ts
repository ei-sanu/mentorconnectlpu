import { IsString, IsNotEmpty, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateGoalDto {
  @ApiProperty({ description: 'The title of the goal' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ description: 'Detailed description of what needs to be achieved' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ description: 'Target date to complete the goal' })
  @IsDateString()
  @IsNotEmpty()
  targetDate: string;
}
