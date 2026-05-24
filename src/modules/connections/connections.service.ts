import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserConnection, ConnectionProvider } from './entities/user-connection.entity';

export interface UpsertConnectionInput {
  userId: string;
  provider: ConnectionProvider;
  accessToken: string;
  refreshToken?: string;
  scopes?: string;
  expiresAt?: Date;
}

@Injectable()
export class ConnectionsService {
  constructor(
    @InjectRepository(UserConnection)
    private connectionsRepo: Repository<UserConnection>,
  ) {}

  async listByUser(userId: string): Promise<UserConnection[]> {
    return this.connectionsRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async findByUserAndProvider(
    userId: string,
    provider: ConnectionProvider,
  ): Promise<UserConnection | null> {
    return this.connectionsRepo.findOne({ where: { userId, provider } });
  }

  async upsertConnection(input: UpsertConnectionInput): Promise<UserConnection> {
    const existing = await this.findByUserAndProvider(input.userId, input.provider);
    if (existing) {
      Object.assign(existing, input);
      return this.connectionsRepo.save(existing);
    }
    return this.connectionsRepo.save(input);
  }

  toPublicDto(connection: UserConnection) {
    return {
      id: connection.id,
      userId: connection.userId,
      provider: connection.provider,
      scopes: connection.scopes?.split(' ') ?? [],
      expiresAt: connection.expiresAt?.toISOString(),
      connectedAt: connection.createdAt.toISOString(),
    };
  }
}
