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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FilesController = void 0;
const common_1 = require("@nestjs/common");
const files_service_1 = require("./files.service");
const clerk_auth_guard_1 = require("../auth/clerk-auth.guard");
const current_user_decorator_1 = require("../auth/current-user.decorator");
const swagger_1 = require("@nestjs/swagger");
let FilesController = class FilesController {
    constructor(filesService) {
        this.filesService = filesService;
    }
    async getPresignedUrl(user, fileName, fileType) {
        const res = await this.filesService.getPresignedUploadUrl(user.id, fileName, fileType);
        return { success: true, data: res };
    }
    async mockUpload(req, res) {
        return res.status(common_1.HttpStatus.OK).json({ success: true, message: 'File mocked-uploaded to bucket successfully' });
    }
    async mockDownload(res) {
        return res.status(common_1.HttpStatus.OK).send(Buffer.from('MOCK_FILE_CONTENT'));
    }
};
exports.FilesController = FilesController;
__decorate([
    (0, common_1.Post)('presign'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(clerk_auth_guard_1.ClerkAuthGuard),
    (0, swagger_1.ApiOperation)({ summary: 'Request a presigned upload URL for a verification file' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)('fileName')),
    __param(2, (0, common_1.Body)('fileType')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], FilesController.prototype, "getPresignedUrl", null);
__decorate([
    (0, common_1.Post)('mock-upload'),
    (0, swagger_1.ApiOperation)({ summary: 'Mock local upload receiver' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], FilesController.prototype, "mockUpload", null);
__decorate([
    (0, common_1.Get)('mock-download/*'),
    (0, swagger_1.ApiOperation)({ summary: 'Mock local download receiver' }),
    __param(0, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], FilesController.prototype, "mockDownload", null);
exports.FilesController = FilesController = __decorate([
    (0, swagger_1.ApiTags)('Files'),
    (0, common_1.Controller)('files'),
    __metadata("design:paramtypes", [files_service_1.FilesService])
], FilesController);
//# sourceMappingURL=files.controller.js.map