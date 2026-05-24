import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Logger, Injectable } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';

@WebSocketGateway({ cors: { origin: '*' } })
@Injectable()
export class NotificationGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  public server: Server;

  private readonly logger = new Logger(NotificationGateway.name);

  constructor(private readonly jwtService: JwtService) {}

  async handleConnection(@ConnectedSocket() client: Socket) {
    try {
      // Extrair o token do cabeçalho de auth do handshake
      const token = this.extractTokenFromHeader(client);
      
      if (!token) {
        this.logger.warn(`Client ${client.id} disconnected: No token provided`);
        client.disconnect();
        return;
      }

      // Validar o token
      const payload = this.jwtService.verify(token);
      const tenantId = payload.tenantId;
      const userId = payload.sub || payload.userId;

      if (!tenantId) {
        this.logger.warn(`Client ${client.id} disconnected: Token without tenantId`);
        client.disconnect();
        return;
      }

      // Colocar o cliente na sala restrita do tenant
      const room = `tenant_${tenantId}`;
      client.join(room);
      
      // Associar dados customizados ao socket para facilitar debbug e disconnects
      client.data = { tenantId, userId };

      this.logger.log(`Client ${client.id} (User: ${userId}) connected and joined room ${room}`);
    } catch (error) {
      this.logger.error(`Client ${client.id} disconnected due to invalid token: ${error.message}`);
      client.disconnect();
    }
  }

  handleDisconnect(@ConnectedSocket() client: Socket) {
    this.logger.log(`Client ${client.id} disconnected.`);
  }

  public sendNotificationToTenant(tenantId: string, event: string, payload: any): void {
    const room = `tenant_${tenantId}`;
    this.server.to(room).emit(event, payload);
    this.logger.log(`Broadcasted event '${event}' to room '${room}'`);
  }

  private extractTokenFromHeader(client: Socket): string | undefined {
    const authHeader = client.handshake.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.split(' ')[1];
    }
    // Suporte também para token no objeto de auth direto do socket.io
    if (client.handshake.auth && client.handshake.auth.token) {
      return client.handshake.auth.token;
    }
    return undefined;
  }
}
