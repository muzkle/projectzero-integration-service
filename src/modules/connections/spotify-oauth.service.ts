import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import {
  decodeOAuthState,
  decodeToken,
  encodeOAuthState,
  encodeToken,
} from '../../common/utils/token-crypto.util';
import { ConnectionsService } from './connections.service';

interface OAuthState {
  userId: string;
  provider: 'spotify' | 'steam';
}

@Injectable()
export class SpotifyOAuthService {
  constructor(
    private config: ConfigService,
    private connectionsService: ConnectionsService,
  ) {}

  buildAuthorizeUrl(userId: string): string {
    const clientId = this.config.get<string>('SPOTIFY_CLIENT_ID');
    const redirectUri = this.config.get<string>('SPOTIFY_REDIRECT_URI');
    const state = encodeOAuthState({ userId, provider: 'spotify' } satisfies OAuthState);
    const scopes = [
      'user-read-recently-played',
      'user-read-playback-state',
      'user-read-email',
    ].join(' ');

    const params = new URLSearchParams({
      client_id: clientId || '',
      response_type: 'code',
      redirect_uri: redirectUri || '',
      scope: scopes,
      state,
    });

    return `https://accounts.spotify.com/authorize?${params.toString()}`;
  }

  async handleCallback(code: string, state: string): Promise<{ userId: string; provider: string }> {
    const { userId, provider } = decodeOAuthState<OAuthState>(state);
    if (provider !== 'spotify') {
      throw new Error('Invalid OAuth state provider');
    }

    const clientId = this.config.get<string>('SPOTIFY_CLIENT_ID');
    const clientSecret = this.config.get<string>('SPOTIFY_CLIENT_SECRET');
    const redirectUri = this.config.get<string>('SPOTIFY_REDIRECT_URI');

    const tokenResponse = await axios.post(
      'https://accounts.spotify.com/api/token',
      new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri || '',
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
        },
      },
    );

    const { access_token, refresh_token, scope, expires_in } = tokenResponse.data;
    const expiresAt = new Date(Date.now() + expires_in * 1000);

    await this.connectionsService.upsertConnection({
      userId,
      provider: 'spotify',
      accessToken: encodeToken(access_token),
      refreshToken: refresh_token ? encodeToken(refresh_token) : undefined,
      scopes: scope,
      expiresAt,
    });

    return { userId, provider: 'spotify' };
  }

  async getValidAccessToken(userId: string): Promise<string | null> {
    const connection = await this.connectionsService.findByUserAndProvider(userId, 'spotify');
    if (!connection) return null;

    if (connection.expiresAt && connection.expiresAt.getTime() > Date.now() + 60_000) {
      return decodeToken(connection.accessToken);
    }

    if (!connection.refreshToken) {
      return decodeToken(connection.accessToken);
    }

    const clientId = this.config.get<string>('SPOTIFY_CLIENT_ID');
    const clientSecret = this.config.get<string>('SPOTIFY_CLIENT_SECRET');

    const tokenResponse = await axios.post(
      'https://accounts.spotify.com/api/token',
      new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: decodeToken(connection.refreshToken),
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
        },
      },
    );

    const { access_token, expires_in, refresh_token } = tokenResponse.data;
    const expiresAt = new Date(Date.now() + expires_in * 1000);

    await this.connectionsService.upsertConnection({
      userId,
      provider: 'spotify',
      accessToken: encodeToken(access_token),
      refreshToken: refresh_token
        ? encodeToken(refresh_token)
        : connection.refreshToken,
      scopes: connection.scopes,
      expiresAt,
    });

    return access_token;
  }
}
