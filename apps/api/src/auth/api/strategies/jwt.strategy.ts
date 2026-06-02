import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

// JWT Configuration Payload. Podes mover para variáveis de ambiente.
export const jwtConstants = {
  secret: process.env.JWT_SECRET || 'fallback-dev-secret-key-do-not-use-in-prod',
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      // Extrai o token do cabecalho Authorization: Bearer <token>
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtConstants.secret,
    });
  }

  /**
   * O Passport valida automaticamente o token. Se for válido, 
   * este método é chamado com o payload decodificado.
   * 
   * Retornar o objeto aqui injeta automaticamente no `req.user`.
   */
  async validate(payload: any) {
    if (!payload.sub || !payload.tenantId) {
      throw new UnauthorizedException('Token inválido ou sem Tenant.');
    }

    // É ESTE RETORNO QUE PERMITE O FUNCIONAMENTO DO @CurrentTenant() 
    return {
      userId: payload.sub,
      email: payload.email,
      tenantId: payload.tenantId, // Muito importante para o isolamento de dados
      role: payload.role,
    };
  }
}
