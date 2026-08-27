import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class RequestChangesDto {
  @ApiProperty({ example: 'Please upload a clearer graduation document.' })
  @IsNotEmpty()
  @IsString()
  explanation: string;
}
