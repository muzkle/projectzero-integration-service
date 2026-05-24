import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { JOB_NAMES, QUEUE_NAMES } from '@muzkle/contracts';

export interface ValidateMissionJobData {
  userId: string;
  missionId: string;
  code?: string;
}

@Injectable()
export class ValidateMissionProducer {
  constructor(
    @InjectQueue(QUEUE_NAMES.INTEGRATION)
    private integrationQueue: Queue,
  ) {}

  async enqueue(userId: string, missionId: string, code?: string) {
    return this.integrationQueue.add(
      JOB_NAMES.VALIDATE_MISSION,
      { userId, missionId, code } satisfies ValidateMissionJobData,
      {
        removeOnComplete: true,
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
      },
    );
  }
}
