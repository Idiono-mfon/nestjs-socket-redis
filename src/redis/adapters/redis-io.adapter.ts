import { IoAdapter } from '@nestjs/platform-socket.io';
import { ServerOptions } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient, RedisClientType } from 'redis';

export class RedisIoAdapter extends IoAdapter {
  private adapterConstructor: ReturnType<typeof createAdapter>;
  public pubClient: RedisClientType;

  async connectToRedis(): Promise<void> {
    this.pubClient = createClient({
      url: `redis://redis-13820.c273.us-east-1-2.ec2.redns.redis-cloud.com:13820`,
      password: 'xG7L2ARpxJPmwpuSPl1DEzhwxP8dUI72',
      username: 'default',
    });
    const subClient = this.pubClient.duplicate();

    await Promise.all([this.pubClient.connect(), subClient.connect()]);

    this.adapterConstructor = createAdapter(this.pubClient, subClient);
  }

  createIOServer(port: number, options?: ServerOptions): any {
    const server = super.createIOServer(port, options);
    server.adapter(this.adapterConstructor);
    return server;
  }
}
