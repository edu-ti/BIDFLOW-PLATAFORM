import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentTenant = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): { tenantId: string; userId: string } => {
    const request = ctx.switchToHttp().getRequest();
    return {
      tenantId: request.headers['x-tenant-id'] || request.user?.tenantId,
      userId: request.user?.sub || request.user?.id,
    };
  },
);
