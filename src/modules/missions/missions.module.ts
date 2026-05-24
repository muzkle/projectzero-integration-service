import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CatalogModule } from '../../infrastructure/catalog/catalog.module';
import { QueueModule } from '../../infrastructure/queue/queue.module';
import { ValidateMissionProcessor } from '../../infrastructure/queue/validate-mission.processor';
import { ConnectionsModule } from '../connections/connections.module';
import { PlayEventsModule } from '../play-events/play-events.module';
import { ValidationLog } from './entities/validation-log.entity';
import { MissionsController } from './missions.controller';
import { MissionsService } from './missions.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([ValidationLog]),
    CatalogModule,
    ConnectionsModule,
    PlayEventsModule,
    QueueModule,
  ],
  controllers: [MissionsController],
  providers: [MissionsService, ValidateMissionProcessor],
  exports: [MissionsService],
})
export class MissionsModule {}
