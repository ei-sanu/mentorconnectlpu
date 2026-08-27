import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const requestId = (request.headers['x-request-id'] as string) || uuidv4();

    // Standardize error body structure
    let message = 'Internal server error';
    let code = 'INTERNAL_SERVER_ERROR';

    if (exception instanceof HttpException) {
      const resContent: any = exception.getResponse();
      if (typeof resContent === 'string') {
        message = resContent;
      } else if (typeof resContent === 'object') {
        message = resContent.message || exception.message;
        code = resContent.error || 'BAD_REQUEST';
      }
    } else {
      // In production, mask internal DB or system exceptions
      message = exception.message || 'An unexpected error occurred';
      this.logger.error(
        `Unhandled exception on ${request.method} ${request.url} - Error: ${exception.stack || exception}`,
      );
    }

    // Never expose stack trace in production responses
    response.status(status).json({
      success: false,
      error: {
        code,
        message: Array.isArray(message) ? message[0] : message, // take first validation error if array
      },
      requestId,
    });
  }
}
