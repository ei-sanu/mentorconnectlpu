import { Controller, Post, Get, Body, Query, UseGuards, Req, Res, HttpStatus } from '@nestjs/common';
import { FilesService } from './files.service';
import { ClerkAuthGuard } from '../auth/clerk-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { Request, Response } from 'express';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Files')
@Controller('files')
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Post('presign')
  @ApiBearerAuth()
  @UseGuards(ClerkAuthGuard)
  @ApiOperation({ summary: 'Request a presigned upload URL for a verification file' })
  async getPresignedUrl(
    @CurrentUser() user: any,
    @Body('fileName') fileName: string,
    @Body('fileType') fileType: string,
  ) {
    const res = await this.filesService.getPresignedUploadUrl(user.id, fileName, fileType);
    return { success: true, data: res };
  }

  // Developer mock local upload endpoint for sandbox / local tests when S3 is down
  @Post('mock-upload')
  @ApiOperation({ summary: 'Mock local upload receiver' })
  async mockUpload(@Req() req: Request, @Res() res: Response) {
    // Simply return success representing a completed upload
    return res.status(HttpStatus.OK).json({ success: true, message: 'File mocked-uploaded to bucket successfully' });
  }

  @Get('mock-download/*')
  @ApiOperation({ summary: 'Mock local download receiver' })
  async mockDownload(@Res() res: Response) {
    // Return a dummy empty PDF or byte stream
    return res.status(HttpStatus.OK).send(Buffer.from('MOCK_FILE_CONTENT'));
  }
}
