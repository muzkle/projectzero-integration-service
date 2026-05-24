import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual } from 'typeorm';
import { PlayEvent } from './entities/play-event.entity';

@Injectable()
export class PlayEventsService {
  constructor(
    @InjectRepository(PlayEvent)
    private playEventsRepo: Repository<PlayEvent>,
  ) {}

  async recordPlay(userId: string, trackId: string, playedAt: Date): Promise<PlayEvent> {
    const existing = await this.playEventsRepo.findOne({
      where: { userId, trackId, playedAt },
    });
    if (existing) return existing;

    return this.playEventsRepo.save({ userId, trackId, playedAt });
  }

  async countPlays(userId: string, trackId: string, since?: Date): Promise<number> {
    if (since) {
      return this.playEventsRepo.count({
        where: { userId, trackId, playedAt: MoreThanOrEqual(since) },
      });
    }
    return this.playEventsRepo.count({ where: { userId, trackId } });
  }
}
