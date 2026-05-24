import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../../decorators/public.decorator';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly reflector: Reflector
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    
    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('Authentication token is missing');
    }

    try {
      const secret = process.env.JWT_SECRET || 'fallback-secret-for-dev';
      const payload = await this.jwtService.verifyAsync(token, {
        secret: secret,
      });

      // The payload strictly requires tenantId, userId, and roles.
      if (!payload.tenantId || !payload.userId) {
        throw new UnauthorizedException('Invalid token payload structure');
      }

      // Attach context to the request for the @CurrentTenant decorator
      request['tenantContext'] = {
        tenantId: payload.tenantId,
        userId: payload.userId,
        roles: payload.roles || [],
      };
      
    } catch (err) {
      throw new UnauthorizedException('Invalid or expired authentication token');
    }

    return true;
  }

  private extractTokenFromHeader(request: any): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
