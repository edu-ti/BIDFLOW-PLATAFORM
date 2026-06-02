import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { PrismaModule } from '../../prisma/prisma.module';
import { AuthController } from './api/controllers/auth.controller';
import { LoginHandler } from './application/commands/login/login.handler';
import { JwtStrategy, jwtConstants } from './api/strategies/jwt.strategy';

@Module({
  imports: [
    CqrsModule,
    PrismaModule,
    PassportModule,
    JwtModule.register({
      secret: jwtConstants.secret,
      signOptions: { expiresIn: '12h' }, // Expiração do token
    }),
  ],
  controllers: [AuthController],
  providers: [
    LoginHandler,
    JwtStrategy,
  ],
})
export class AuthModule {}
