import { LoginDto } from './login.dto';

export class LoginCommand {
  constructor(public readonly dto: LoginDto) {}
}
