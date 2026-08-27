import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RejectVerificationDto {
  @ApiProperty({ description: 'The reason why the verification was rejected' })
  @IsString()
  @IsNotEmpty()
  rejectionReason: string;
}
