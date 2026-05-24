import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import {
  ErrorCode,
  MissionDto,
  MissionType,
  MissionValidatedEvent,
} from '@projectzero/contracts';
import { CatalogClient } from '../../infrastructure/catalog/catalog.client';
import { ConnectionsService } from '../connections/connections.service';
import { SpotifyOAuthService } from '../connections/spotify-oauth.service';
import { PlayEventsService } from '../play-events/play-events.service';
import { ValidationLog } from './entities/validation-log.entity';
import { hashCode } from '../../common/utils/token-crypto.util';
import { MissionEventsProducer } from '../../infrastructure/queue/mission-events.producer';

export interface ValidationResult {
  completed: boolean;
  progress: Record<string, unknown>;
  mission: MissionDto;
  event: MissionValidatedEvent;
}

@Injectable()
export class MissionsService {
  constructor(
    private catalogClient: CatalogClient,
    private connectionsService: ConnectionsService,
    private spotifyOAuth: SpotifyOAuthService,
    private playEventsService: PlayEventsService,
    private missionEventsProducer: MissionEventsProducer,
    @InjectRepository(ValidationLog)
    private validationLogRepo: Repository<ValidationLog>,
  ) {}

  async validateMission(
    userId: string,
    missionId: string,
    code?: string,
    publishEvent = true,
  ): Promise<ValidationResult> {
    const mission = await this.catalogClient.getMission(missionId);
    const { completed, progress } = await this.runValidation(userId, mission, code);

    const event: MissionValidatedEvent = {
      eventId: uuidv4(),
      userId,
      missionId: mission.id,
      stickerId: mission.stickerId,
      completed,
      progress,
      occurredAt: new Date().toISOString(),
    };

    await this.validationLogRepo.save({
      userId,
      missionId: mission.id,
      missionType: mission.type,
      completed,
      details: { progress, stickerId: mission.stickerId },
    });

    if (publishEvent) {
      await this.missionEventsProducer.publishMissionValidated(event);
    }

    return { completed, progress, mission, event };
  }

  private async runValidation(
    userId: string,
    mission: MissionDto,
    code?: string,
  ): Promise<{ completed: boolean; progress: Record<string, unknown> }> {
    switch (mission.type) {
      case MissionType.SPOTIFY_TRACK_PLAYS:
        return this.validateSpotifyPlays(userId, mission);
      case MissionType.STEAM_ACHIEVEMENT:
        return this.validateSteamAchievement(userId, mission);
      case MissionType.MANUAL_CODE:
        return this.validateManualCode(mission, code);
      default:
        throw new BadRequestException({
          code: ErrorCode.NOT_FOUND,
          message: `Unsupported mission type: ${mission.type}`,
        });
    }
  }

  private async validateSpotifyPlays(
    userId: string,
    mission: MissionDto,
  ): Promise<{ completed: boolean; progress: Record<string, unknown> }> {
    const connection = await this.connectionsService.findByUserAndProvider(userId, 'spotify');
    if (!connection) {
      throw new BadRequestException({
        code: ErrorCode.CONNECTION_REQUIRED,
        message: 'Spotify connection required',
      });
    }

    const trackId = mission.config.trackId;
    const minPlays = mission.config.minPlays ?? 1;
    const windowDays = mission.config.windowDays ?? 30;

    if (!trackId) {
      throw new BadRequestException({
        code: ErrorCode.NOT_FOUND,
        message: 'Mission missing trackId config',
      });
    }

    await this.syncSpotifyPlays(userId, trackId);

    const since = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000);
    const playCount = await this.playEventsService.countPlays(userId, trackId, since);
    const completed = playCount >= minPlays;

    return {
      completed,
      progress: { trackId, playCount, minPlays, windowDays },
    };
  }

  private async syncSpotifyPlays(userId: string, trackId: string): Promise<void> {
    const accessToken = await this.spotifyOAuth.getValidAccessToken(userId);
    if (!accessToken) return;

    try {
      const response = await axios.get<{
        items: Array<{ played_at: string; track: { id: string } }>;
      }>('https://api.spotify.com/v1/me/player/recently-played', {
        headers: { Authorization: `Bearer ${accessToken}` },
        params: { limit: 50 },
      });

      for (const item of response.data.items) {
        if (item.track.id === trackId) {
          await this.playEventsService.recordPlay(userId, trackId, new Date(item.played_at));
        }
      }
    } catch (error) {
      console.warn('Spotify recently-played sync failed', error);
    }
  }

  private async validateSteamAchievement(
    userId: string,
    mission: MissionDto,
  ): Promise<{ completed: boolean; progress: Record<string, unknown> }> {
    const connection = await this.connectionsService.findByUserAndProvider(userId, 'steam');
    if (!connection) {
      throw new BadRequestException({
        code: ErrorCode.CONNECTION_REQUIRED,
        message: 'Steam connection required',
      });
    }

    const { appId, achievementApiName } = mission.config;
    if (!appId || !achievementApiName) {
      throw new BadRequestException({
        code: ErrorCode.NOT_FOUND,
        message: 'Mission missing Steam achievement config',
      });
    }

    const completed = true;

    return {
      completed,
      progress: {
        appId,
        achievementApiName,
        mock: true,
        message: 'Steam achievement validation mocked for MVP',
      },
    };
  }

  private validateManualCode(
    mission: MissionDto,
    code?: string,
  ): { completed: boolean; progress: Record<string, unknown> } {
    if (!code) {
      throw new BadRequestException({
        code: ErrorCode.INVALID_CODE,
        message: 'Code is required for manual_code missions',
      });
    }

    const expectedHash = mission.config.codeHash;
    if (!expectedHash) {
      throw new BadRequestException({
        code: ErrorCode.NOT_FOUND,
        message: 'Mission missing codeHash config',
      });
    }

    const submittedHash = hashCode(code);
    const completed = submittedHash === expectedHash;

    return {
      completed,
      progress: { codeSubmitted: true, hashMatch: completed },
    };
  }
}
