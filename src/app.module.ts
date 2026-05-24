import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConnectionsModule } from './modules/connections/connections.module';
import { MissionsModule } from './modules/missions/missions.module';
import { HealthModule } from './infrastructure/health/health.module';
import { QueueModule } from './infrastructure/queue/queue.module';
import { UserConnection } from './modules/connections/entities/user-connection.entity';
import { PlayEvent } from './modules/play-events/entities/play-event.entity';
import { ValidationLog } from './modules/missions/entities/validation-log.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      entities: [UserConnection, PlayEvent, ValidationLog],
      synchronize: process.env.NODE_ENV !== 'production',
      ssl: process.env.DATABASE_URL?.includes('railway') ? { rejectUnauthorized: false } : false,
    }),
    QueueModule,
    ConnectionsModule,
    MissionsModule,
    HealthModule,
  ],
})
export class AppModule {}
