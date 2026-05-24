import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentTenant = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    // jwt-auth.guard attaches the token payload to request.tenantContext
    return request.tenantContext;
  },
);
