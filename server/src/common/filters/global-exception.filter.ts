import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    let message = 'Internal server error';

    if (exception instanceof HttpException) {
      const resp = exception.getResponse();
      message =
        typeof resp === 'string'
          ? resp
          : (resp as any).message || exception.message;
    } else {
      // Check for Postgrest or typical database errors
      if (exception?.code || exception?.details) {
        // Log the raw database error server-side
        this.logger.error(
          `Database Error [${exception.code}]: ${exception.message} - Details: ${exception.details}`,
        );
        // Do not leak database internals to the client
        message = 'A database operation failed';
        status = HttpStatus.BAD_REQUEST; // Often 400 for constraints
      } else {
        // Unknown errors
        this.logger.error(`Unhandled Exception: ${exception.message || exception}`);
      }
    }

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message: message,
    });
  }
}
