import { IsString, IsInt, IsNotEmpty, IsUrl } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SubmitVerificationDto {
  @ApiProperty({ description: 'Lovely Professional University Student/Alumni Roll Number' })
  @IsString()
  @IsNotEmpty()
  rollNumber: string;

  @ApiProperty({ description: 'Degree completed at LPU' })
  @IsString()
  @IsNotEmpty()
  degree: string;

  @ApiProperty({ description: 'Year of graduation' })
  @IsInt()
  @IsNotEmpty()
  graduationYear: number;

  @ApiProperty({ description: 'S3 URL of the graduation certificate or ID card' })
  @IsUrl()
  @IsNotEmpty()
  documentUrl: string;
}
