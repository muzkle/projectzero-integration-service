import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import {
  JOB_NAMES,
  MissionValidatedEvent,
  QUEUE_NAMES,
} from '@projectzero/contracts';

@Injectable()
export class MissionEventsProducer {
  constructor(
    @InjectQueue(QUEUE_NAMES.COLLECTION)
    private collectionQueue: Queue,
  ) {}

  async publishMissionValidated(event: MissionValidatedEvent): Promise<void> {
    await this.collectionQueue.add(JOB_NAMES.MISSION_VALIDATED, event, {
      jobId: event.eventId,
      removeOnComplete: true,
      attempts: 3,
      backoff: { type: 'exponential', delay: 1000 },
    });
  }
}
