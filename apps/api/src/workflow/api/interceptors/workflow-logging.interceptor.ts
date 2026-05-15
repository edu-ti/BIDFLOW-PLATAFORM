import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { v4 as uuid } from 'uuid';

@Injectable()
export class WorkflowLoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('WorkflowHTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url } = request;
    const correlationId = uuid();
    const start = Date.now();

    request.correlationId = correlationId;

    return next.handle().pipe(
      tap({
        next: () => {
          const duration = Date.now() - start;
          this.logger.log(`${method} ${url} ${duration}ms`, {
            method, url, duration, correlationId,
            tenantId: request.headers['x-tenant-id'],
          });
        },
        error: (error) => {
          const duration = Date.now() - start;
          this.logger.error(`${method} ${url} ${duration}ms - ${error.message}`, {
            method, url, duration, correlationId,
            status: error.status, error: error.message,
          });
        },
      }),
    );
  }
}
