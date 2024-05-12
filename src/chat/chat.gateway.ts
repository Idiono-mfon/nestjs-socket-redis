import { Logger } from '@nestjs/common';

import {
  SubscribeMessage,
  WebSocketGateway,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  WebSocketServer,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { RedistoreService } from '../redis/redistore/redistore.service';
import { IHandShakeQuery } from './interface';
import { IOnlineUser } from 'src/redis/interface';

@WebSocketGateway({
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    credentials: true,
  },
})
export class ChatGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(ChatGateway.name);

  db: IOnlineUser[] = [
    {
      userId: '345345',
      dp: 'https://google.com',
      username: 'Adama',
      socketId: '122',
      isActive: true,
      deviceToken: '',
    },
  ];

  constructor(private readonly redisStore: RedistoreService) {}

  @WebSocketServer() io: Server;

  afterInit() {
    this.logger.log('Initialized');
  }

  async handleConnection(@ConnectedSocket() client: Socket, ...args: any[]) {
    const { sockets } = this.io.sockets;
    console.log(client.handshake.query);
    const clientQuery: IHandShakeQuery = client.handshake
      .query as unknown as IHandShakeQuery;
    // Query Database to Fetch User record
    const userFromDb = this.db.find(user => user.userId === clientQuery.userId);

    if (userFromDb) {
      // Add user to Redis as Online  User
      const user: IOnlineUser = {
        userId: clientQuery.userId,
        socketId: client.id,
        deviceToken: clientQuery.deviceToken || '4546465656565656',
        username: userFromDb.username,
        dp: userFromDb.dp,
        isActive: true,
      };
      await this.redisStore.saveOnlineUser(user);
    }
    // Throw an error

    this.logger.log(`Client id: ${client.id} connected`);
    this.logger.debug(`Number of connected clients: ${sockets.size}`);
  }

  async handleDisconnect(@ConnectedSocket() client: Socket) {
    this.logger.log(`Client id:${client.id} disconnected`);
    await this.redisStore.logoutUserBySocketId(client.id);
  }

  @SubscribeMessage('ping')
  handleMessage(@ConnectedSocket() client: Socket, data: any) {
    this.logger.log(`Message received from client id: ${client.id}`);
    this.logger.debug(`Payload: ${data}`);

    // const subClient = this.redisIoAdapter.subClient;
    this.io.emit('pong', 'Wrong data that will make the test fail');
  }

  @SubscribeMessage('getOnlineUsers')
  async handleGetOnlineUsers(@ConnectedSocket() client: Socket) {
    this.logger.log(`Message received from client id: ${client.id}`);
    return await this.redisStore.getActiveOnlineUsers();

    // const subClient = this.redisIoAdapter.subClient;
    this.io.emit('pong', 'Wrong data that will make the test fail');
  }
}
