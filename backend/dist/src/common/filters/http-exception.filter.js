"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var HttpExceptionFilter_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.HttpExceptionFilter = void 0;
const common_1 = require("@nestjs/common");
const uuid_1 = require("uuid");
let HttpExceptionFilter = HttpExceptionFilter_1 = class HttpExceptionFilter {
    constructor() {
        this.logger = new common_1.Logger(HttpExceptionFilter_1.name);
    }
    catch(exception, host) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        const request = ctx.getRequest();
        const status = exception instanceof common_1.HttpException
            ? exception.getStatus()
            : common_1.HttpStatus.INTERNAL_SERVER_ERROR;
        const requestId = request.headers['x-request-id'] || (0, uuid_1.v4)();
        let message = 'Internal server error';
        let code = 'INTERNAL_SERVER_ERROR';
        if (exception instanceof common_1.HttpException) {
            const resContent = exception.getResponse();
            if (typeof resContent === 'string') {
                message = resContent;
            }
            else if (typeof resContent === 'object') {
                message = resContent.message || exception.message;
                code = resContent.error || 'BAD_REQUEST';
            }
        }
        else {
            message = exception.message || 'An unexpected error occurred';
            this.logger.error(`Unhandled exception on ${request.method} ${request.url} - Error: ${exception.stack || exception}`);
        }
        response.status(status).json({
            success: false,
            error: {
                code,
                message: Array.isArray(message) ? message[0] : message,
            },
            requestId,
        });
    }
};
exports.HttpExceptionFilter = HttpExceptionFilter;
exports.HttpExceptionFilter = HttpExceptionFilter = HttpExceptionFilter_1 = __decorate([
    (0, common_1.Catch)()
], HttpExceptionFilter);
//# sourceMappingURL=http-exception.filter.js.map