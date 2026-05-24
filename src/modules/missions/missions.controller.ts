import { Controller, Param, Post, Body, UseGuards } from '@nestjs/common';
import { UserIdGuard } from '../../common/guards/user-id.guard';
import { UserId } from '../../common/decorators/user-id.decorator';
import { MissionsService } from './missions.service';
import { ValidateMissionBodyDto } from './dto/validate-mission.dto';
import { ValidateMissionProducer } from '../../infrastructure/queue/validate-mission.producer';

@Controller('missions')
export class MissionsController {
  constructor(
    private missionsService: MissionsService,
    private validateMissionProducer: ValidateMissionProducer,
  ) {}

  @Post(':missionId/validate')
  @UseGuards(UserIdGuard)
  async validate(
    @UserId() userId: string,
    @Param('missionId') missionId: string,
    @Body() body: ValidateMissionBodyDto,
  ) {
    if (body.async) {
      const job = await this.validateMissionProducer.enqueue(userId, missionId, body.code);
      return { jobId: job.id, status: 'queued' };
    }

    const result = await this.missionsService.validateMission(userId, missionId, body.code);
    return {
      completed: result.completed,
      progress: result.progress,
      missionId: result.mission.id,
      stickerId: result.mission.stickerId,
      eventId: result.event.eventId,
    };
  }
}
