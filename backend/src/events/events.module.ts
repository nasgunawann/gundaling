import { Global, Module } from '@nestjs/common';
import { SocketStateService } from './socket-state.service';
import { PosGateway } from './pos.gateway';

@Global()
@Module({
  providers: [SocketStateService, PosGateway],
  exports: [SocketStateService, PosGateway],
})
export class EventsModule {}
