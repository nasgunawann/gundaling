import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { Injectable } from '@nestjs/common';
import { SocketStateService } from './socket-state.service';

@WebSocketGateway({
  cors: {
    origin: process.env.CORS_ORIGINS
      ? process.env.CORS_ORIGINS.split(',').map(s => s.trim())
      : /^https?:\/\/(localhost|127\.0\.0\.1|192\.168\.\d{1,3}\.\d{1,3}|10\.\d{1,3}\.\d{1,3}\.\d{1,3})(:\d+)?$/,
  },
})
@Injectable()
export class PosGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  constructor(
    private jwtService: JwtService,
    private socketState: SocketStateService,
  ) {}

  afterInit(server: Server) {
    this.socketState.socketServer = server;
  }

  async handleConnection(client: Socket) {
    const token = client.handshake.auth?.token as string | undefined;
    if (!token) {
      client.disconnect();
      return;
    }
    try {
      const payload = await this.jwtService.verifyAsync<{
        sub: number;
        role: string;
      }>(token, {
        secret: process.env.JWT_SECRET,
      });
      client.data = { user: payload };
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect() {}

  emitEvent(event: string, data: any) {
    if (this.server) {
      this.server.emit(event, data);
    }
  }
}
