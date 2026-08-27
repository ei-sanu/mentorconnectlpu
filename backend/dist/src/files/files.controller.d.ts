import { FilesService } from './files.service';
import { Request, Response } from 'express';
export declare class FilesController {
    private readonly filesService;
    constructor(filesService: FilesService);
    getPresignedUrl(user: any, fileName: string, fileType: string): Promise<{
        success: boolean;
        data: {
            uploadUrl: string;
            publicUrl: string;
            key: string;
        };
    }>;
    mockUpload(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    mockDownload(res: Response): Promise<Response<any, Record<string, any>>>;
}
