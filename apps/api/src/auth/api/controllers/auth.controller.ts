import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CommandBus } from '@nestjs/cqrs';
import { LoginDto } from '../../application/commands/login/login.dto';
import { LoginCommand } from '../../application/commands/login/login.command';
// @Public() // Descomenta se tiveres um decorador de Public guard global

@ApiTags('Auth')
@Controller('v1/auth')
export class AuthController {
  constructor(private readonly commandBus: CommandBus) {}

  // @Public()
  @Post('login')
  @ApiOperation({ summary: 'Autentica o utilizador e retorna um token JWT' })
  @ApiResponse({ status: 200, description: 'Login efetuado com sucesso' })
  @ApiResponse({ status: 401, description: 'Credenciais inválidas' })
  async login(@Body() dto: LoginDto) {
    const command = new LoginCommand(dto);
    return this.commandBus.execute(command);
  }
}
