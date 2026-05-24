import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { QUEUE_NAMES } from '@projectzero/contracts';
import { MissionEventsProducer } from './mission-events.producer';
import { ValidateMissionProducer } from './validate-mission.producer';

@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: { url: config.get<string>('REDIS_URL') },
      }),
    }),
    BullModule.registerQueue(
      { name: QUEUE_NAMES.INTEGRATION },
      { name: QUEUE_NAMES.COLLECTION },
    ),
  ],
  providers: [MissionEventsProducer, ValidateMissionProducer],
  exports: [MissionEventsProducer, ValidateMissionProducer, BullModule],
})
export class QueueModule {}
