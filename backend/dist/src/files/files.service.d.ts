export declare class FilesService {
    private readonly logger;
    private s3Client;
    private bucketName;
    constructor();
    getPresignedUploadUrl(userId: string, fileName: string, fileType: string): Promise<{
        uploadUrl: string;
        publicUrl: string;
        key: string;
    }>;
}
