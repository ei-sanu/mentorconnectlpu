import { IsString, IsNotEmpty, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateRequestDto {
  @ApiProperty({ description: 'The Profile ID of the mentor' })
  @IsString()
  @IsNotEmpty()
  mentorId: string;

  @ApiProperty({ description: 'Personalized introduction or message' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  message: string;

  @ApiProperty({ description: 'Specific mentoring goal' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  goal: string;
}
