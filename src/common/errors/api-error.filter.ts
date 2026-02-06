import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { AxiosError } from 'axios';
import type { ErrorCode } from './error.codes';

type ApiErrorBody = {
  error: {
    code: ErrorCode;
    message: string;
    requestId?: string;
    details?: unknown;
  };
};

@Catch()
export class ApiErrorFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request & { requestId?: string }>();

    const requestId = req.requestId;

    // Nest HttpExceptions (validation, etc.)
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const response = exception.getResponse() as any;

      const body: ApiErrorBody = {
        error: {
          code: status === 400 ? 'VALIDATION_ERROR' : 'INTERNAL_ERROR',
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
          message: response?.message ?? exception.message,
          requestId,
          details: response,
        },
      };

      return res.status(status).json(body);
    }

    // Axios errors from downstream
    if (isAxiosError(exception)) {
      const mapped = mapAxiosToApiError(exception);
      return res.status(mapped.status).json({
        error: {
          code: mapped.code,
          message: mapped.message,
          requestId,
          details: mapped.details,
        },
      } satisfies ApiErrorBody);
    }

    // Fallback
    return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Unexpected error',
        requestId,
      },
    } satisfies ApiErrorBody);
  }
}

function isAxiosError(e: unknown): e is AxiosError {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  return !!e && typeof e === 'object' && (e as any).isAxiosError === true;
}

function mapAxiosToApiError(err: AxiosError): {
  status: number;
  code: ErrorCode;
  message: string;
  details?: unknown;
} {
  // timeout
  if (err.code === 'ECONNABORTED') {
    return {
      status: HttpStatus.GATEWAY_TIMEOUT,
      code: 'DOWNSTREAM_TIMEOUT',
      message: 'Downstream service timed out',
      details: { code: err.code },
    };
  }

  // No response => network error / service down
  if (!err.response) {
    return {
      status: HttpStatus.BAD_GATEWAY,
      code: 'DOWNSTREAM_UNAVAILABLE',
      message: 'Downstream service unavailable',
      details: { code: err.code, message: err.message },
    };
  }

  // Response exists but status indicates an issue
  return {
    status: HttpStatus.BAD_GATEWAY,
    code: 'DOWNSTREAM_BAD_RESPONSE',
    message: 'Downstream service returned an error response',
    details: {
      downstreamStatus: err.response.status,
      downstreamData: err.response.data,
    },
  };
}
