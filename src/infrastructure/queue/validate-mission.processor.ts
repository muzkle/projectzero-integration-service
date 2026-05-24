import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { JOB_NAMES, QUEUE_NAMES } from '@projectzero/contracts';
import { MissionsService } from '../../modules/missions/missions.service';
import { ValidateMissionJobData } from './validate-mission.producer';

@Processor(QUEUE_NAMES.INTEGRATION)
export class ValidateMissionProcessor extends WorkerHost {
  constructor(private missionsService: MissionsService) {
    super();
  }

  async process(job: Job<ValidateMissionJobData>): Promise<unknown> {
    if (job.name !== JOB_NAMES.VALIDATE_MISSION) {
      return null;
    }

    const { userId, missionId, code } = job.data;
    const result = await this.missionsService.validateMission(userId, missionId, code, true);

    return {
      completed: result.completed,
      progress: result.progress,
      eventId: result.event.eventId,
    };
  }
}
