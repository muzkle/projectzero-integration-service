import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { ErrorCode } from '@muzkle/contracts';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const body = exception.getResponse();
      const message = typeof body === 'string' ? body : (body as Record<string, string>).message;
      const code = (body as Record<string, string>)?.code || ErrorCode.NOT_FOUND;
      return response.status(status).json({
        error: { code, message: Array.isArray(message) ? message[0] : message },
      });
    }

    console.error(exception);
    return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      error: { code: ErrorCode.NOT_FOUND, message: 'Internal server error' },
    });
  }
}
