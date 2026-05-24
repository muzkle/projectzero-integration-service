import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import { ErrorCode, MissionDto } from '@muzkle/contracts';

@Injectable()
export class CatalogClient {
  private client: AxiosInstance;

  constructor(private config: ConfigService) {
    this.client = axios.create({
      baseURL: this.config.get('CATALOG_SERVICE_URL'),
      timeout: 15000,
    });
  }

  async getMission(missionId: string): Promise<MissionDto> {
    try {
      const response = await this.client.get<{ data: MissionDto }>(`/v1/missions/${missionId}`, {
        headers: {
          'x-internal-service-key': this.config.get('INTERNAL_SERVICE_KEY'),
        },
      });
      return response.data.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        throw new NotFoundException({
          code: ErrorCode.NOT_FOUND,
          message: `Mission ${missionId} not found`,
        });
      }
      throw error;
    }
  }
}
