"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var FilesService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.FilesService = void 0;
const common_1 = require("@nestjs/common");
const client_s3_1 = require("@aws-sdk/client-s3");
const s3_request_presigner_1 = require("@aws-sdk/s3-request-presigner");
const uuid_1 = require("uuid");
let FilesService = FilesService_1 = class FilesService {
    constructor() {
        this.logger = new common_1.Logger(FilesService_1.name);
        this.s3Client = null;
        const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
        const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
        const region = process.env.AWS_REGION || 'us-east-1';
        this.bucketName = process.env.S3_BUCKET_NAME || 'lpu-mentorconnect-assets';
        if (accessKeyId && accessKeyId !== 'mock_key') {
            const config = {
                region,
                credentials: {
                    accessKeyId,
                    secretAccessKey,
                },
            };
            if (process.env.S3_ENDPOINT) {
                config.endpoint = process.env.S3_ENDPOINT;
                config.forcePathStyle = true;
            }
            this.s3Client = new client_s3_1.S3Client(config);
        }
    }
    async getPresignedUploadUrl(userId, fileName, fileType) {
        const allowedMimeTypes = [
            'image/jpeg',
            'image/png',
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ];
        if (!allowedMimeTypes.includes(fileType)) {
            throw new common_1.BadRequestException('MIME type not allowed. Supported: JPEG, PNG, PDF, DOC, DOCX');
        }
        const fileExtension = fileName.split('.').pop();
        const uniqueKey = `verifications/${userId}/${(0, uuid_1.v4)()}.${fileExtension}`;
        if (this.s3Client) {
            try {
                const command = new client_s3_1.PutObjectCommand({
                    Bucket: this.bucketName,
                    Key: uniqueKey,
                    ContentType: fileType,
                });
                const uploadUrl = await (0, s3_request_presigner_1.getSignedUrl)(this.s3Client, command, { expiresIn: 900 });
                const publicUrl = process.env.S3_ENDPOINT
                    ? `${process.env.S3_ENDPOINT}/${this.bucketName}/${uniqueKey}`
                    : `https://${this.bucketName}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${uniqueKey}`;
                return {
                    uploadUrl,
                    publicUrl,
                    key: uniqueKey,
                };
            }
            catch (err) {
                this.logger.error(`S3 presigned URL generation failed: ${err.message}`);
                throw new common_1.BadRequestException('Failed to generate upload URL');
            }
        }
        else {
            this.logger.log(`Mocking upload URL generation for file: ${fileName}`);
            const mockKey = `uploads/mock-${(0, uuid_1.v4)()}-${fileName}`;
            return {
                uploadUrl: `${process.env.APP_URL || 'http://localhost:3001'}/api/v1/files/mock-upload?key=${mockKey}`,
                publicUrl: `${process.env.APP_URL || 'http://localhost:3001'}/api/v1/files/mock-download/${mockKey}`,
                key: mockKey,
            };
        }
    }
};
exports.FilesService = FilesService;
exports.FilesService = FilesService = FilesService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], FilesService);
//# sourceMappingURL=files.service.js.map