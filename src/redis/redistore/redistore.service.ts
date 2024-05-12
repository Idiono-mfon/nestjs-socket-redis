import { BadRequestException, Injectable } from '@nestjs/common';
import { RedisIoAdapter } from '../adapters/redis-io.adapter';
import * as _ from 'lodash';

import { IOnlineUser } from '../interface';
import { RedisClientType } from 'redis';
@Injectable()
export class RedistoreService {
  private readonly onlineUsersKey: string;
  private readonly redisClient: RedisClientType;

  constructor(private readonly redisIoAdapter: RedisIoAdapter) {
    this.redisIoAdapter.connectToRedis();
    this.onlineUsersKey = 'onlineUsers';
    this.redisClient = this.redisIoAdapter.pubClient;
    this.redisClient = this.redisIoAdapter.pubClient;
  }

  private static encodeBase64(data: any): string {
    // logger.info('Running RedisStore.encodeBase64');
    // Create buffer object, specifying utf8 as encoding
    const bufferObj = Buffer.from(data, 'utf8');
    // Encode the Buffer as a base64 string
    return bufferObj.toString('base64');
  }

  private static decodeBase64(base64Str: string): any {
    // logger.info('Running RedisStore.decodeBase64');
    // Create a buffer from the string
    const bufferObj = Buffer.from(base64Str, 'base64');
    // Encode the Buffer as a utf8 string
    return bufferObj.toString('utf8');
  }

  public async getActiveOnlineUsers(): Promise<IOnlineUser[]> {
    // logger.info('Running RedisStore.getOnlineUsers');
    try {
      const onlineUsers: IOnlineUser[] | any = await this.getOnlineUsers();

      return _.filter(onlineUsers, (user: IOnlineUser) => {
        return user.isActive;
      });
    } catch (e: any) {
      throw new BadRequestException('error occurred while fetching user');
    }
  }

  public async getOnlineUsers(): Promise<IOnlineUser[]> {
    // logger.info('Running RedisStore.getOnlineUsers');
    try {
      const encodedOnlineUsers = await this.redisClient.get(
        this.onlineUsersKey,
      );

      if (!encodedOnlineUsers) {
        return [];
      }

      // Decode data
      const onlineUsersStr = RedistoreService.decodeBase64(encodedOnlineUsers);
      const oUsers: any = JSON.parse(onlineUsersStr);
      //   logger.info('RedisStore.getOnlineUsers: VIDEO PN ', oUsers);
      return oUsers;
    } catch (e: any) {
      throw new BadRequestException('error occurred while fetching user');
    }
  }

  public async getUserById(userId: string): Promise<IOnlineUser | any> {
    // logger.info('Running RedisStore.getUserById');
    try {
      // Get All Online Users
      const onlineUsers: IOnlineUser[] | any = await this.getOnlineUsers();

      if (!onlineUsers || _.isEmpty(onlineUsers)) {
        return;
      }

      let onlineUser: IOnlineUser | any;
      for (const user of onlineUsers) {
        if (user?.userId === userId) {
          onlineUser = user;
          break;
        }
      }

      return onlineUser;
    } catch (e: any) {
      console.log(e);
      throw new BadRequestException('error occurred while fetching user');
    }
  }

  public async getUserBySocketId(socketId: string): Promise<IOnlineUser | any> {
    // logger.info('Running RedisStore.getUserBySocketId');
    try {
      // Get All Online Users
      const onlineUsers: IOnlineUser[] | any = await this.getOnlineUsers();

      console.log(onlineUsers);

      if (!onlineUsers || _.isEmpty(onlineUsers)) {
        return;
      }

      let onlineUser: IOnlineUser | any;
      for (const user of onlineUsers) {
        if (user?.socketId === socketId) {
          onlineUser = user;
          break;
        }
      }

      return onlineUser;
    } catch (e: any) {
      console.log('Yeah Cool', e);
      throw new BadRequestException('error occurred while fetching user');
    }
  }

  public async logoutUserBySocketId(socketId: string): Promise<void> {
    // logger.info('Running RedisStore.removeUserById');
    try {
      const loggedInUser: IOnlineUser = await this.getUserBySocketId(socketId);

      loggedInUser.isActive = false;

      const onlineUsers: IOnlineUser[] | any = await this.getOnlineUsers();
      // Remove the previous active user
      _.remove(onlineUsers, (user: IOnlineUser | any) => {
        return user?.userId === loggedInUser.userId;
      });

      //   Add updated user with state
      onlineUsers.push(loggedInUser);

      const base64Str = RedistoreService.encodeBase64(
        JSON.stringify(onlineUsers),
      );

      await this.redisClient.set(this.onlineUsersKey, base64Str);
    } catch (e: any) {
      throw new BadRequestException('error occurred while fetching user');
    }
  }

  public async removeUserById(userId: string): Promise<void> {
    // logger.info('Running RedisStore.removeUserById');
    try {
      // Get All Online Users
      const onlineUsers: IOnlineUser[] | any = await this.getOnlineUsers();

      if (!onlineUsers) {
        return;
      }

      _.remove(onlineUsers, (user: IOnlineUser | any) => {
        return user?.userId === userId;
      });

      const base64Str = RedistoreService.encodeBase64(
        JSON.stringify(onlineUsers),
      );

      await this.redisClient.set(this.onlineUsersKey, base64Str);
    } catch (e: any) {
      throw new BadRequestException('error occurred while fetching user');
    }
  }

  public async removeAllRecords(key: string): Promise<void> {
    // logger.info('Running RedisStore.removeAllRecords');
    try {
      await this.redisClient.del(key);
    } catch (e: any) {
      throw new BadRequestException('error occurred while removing user');
    }
  }

  public async removeUserBySocketId(socketId: string): Promise<void> {
    // logger.info('Running RedisStore.removeUserBySocketId');
    try {
      // Get All Online Users
      const onlineUsers: IOnlineUser[] | any = await this.getOnlineUsers();

      if (!onlineUsers) {
        return;
      }

      _.remove(onlineUsers, (user: IOnlineUser | any) => {
        return user?.socketId === socketId;
      });

      const base64Str = RedistoreService.encodeBase64(
        JSON.stringify(onlineUsers),
      );

      await this.redisClient.set(this.onlineUsersKey, base64Str);
    } catch (e: any) {
      throw new BadRequestException('error occurred while removing user');
    }
  }

  public async saveOnlineUser(user: IOnlineUser): Promise<void> {
    // logger.info('Running RedisStore.saveOnlineUser');
    try {
      // Get All Online Users
      let onlineUsers: IOnlineUser[] = await this.getOnlineUsers();

      if (!onlineUsers) {
        onlineUsers = [];
      }

      const existingUser = await this.getUserById(user.userId);

      if (existingUser) {
        user = {
          ...existingUser,
          deviceToken: user.deviceToken,
          socketId: user.socketId,
          isActive: true,
        };

        // Remove the existing user
        _.remove(onlineUsers, (onlineUser: IOnlineUser) => {
          return onlineUser?.userId === existingUser.userId;
        });
      }

      // Update with the new users
      onlineUsers.push(user);

      // Encode to Base64
      const base64Str = RedistoreService.encodeBase64(
        JSON.stringify(onlineUsers),
      );

      // Save online user
      await this.redisClient.set(this.onlineUsersKey, base64Str);
    } catch (e: any) {
      throw new BadRequestException('error occurred while removing user');
    }
  }
}
