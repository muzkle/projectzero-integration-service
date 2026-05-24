import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { decodeOAuthState, encodeOAuthState, encodeToken } from '../../common/utils/token-crypto.util';
import { ConnectionsService } from './connections.service';

interface OAuthState {
  userId: string;
  provider: 'spotify' | 'steam';
}

@Injectable()
export class SteamOAuthService {
  constructor(
    private config: ConfigService,
    private connectionsService: ConnectionsService,
  ) {}

  buildAuthorizeUrl(userId: string): string {
    const redirectUri = this.config.get<string>('STEAM_REDIRECT_URI');
    const state = encodeOAuthState({ userId, provider: 'steam' } satisfies OAuthState);

    const params = new URLSearchParams({
      'openid.ns': 'http://specs.openid.net/auth/2.0',
      'openid.mode': 'checkid_setup',
      'openid.return_to': `${redirectUri}?state=${state}`,
      'openid.realm': redirectUri || '',
      'openid.identity': 'http://specs.openid.net/auth/2.0/identifier_select',
      'openid.claimed_id': 'http://specs.openid.net/auth/2.0/identifier_select',
    });

    return `https://steamcommunity.com/openid/login?${params.toString()}`;
  }

  async handleCallback(state: string, steamId?: string): Promise<{ userId: string; provider: string }> {
    const { userId, provider } = decodeOAuthState<OAuthState>(state);
    if (provider !== 'steam') {
      throw new Error('Invalid OAuth state provider');
    }

    const mockToken = encodeToken(steamId || `steam-stub-${userId}`);

    await this.connectionsService.upsertConnection({
      userId,
      provider: 'steam',
      accessToken: mockToken,
      scopes: 'openid',
      expiresAt: undefined,
    });

    return { userId, provider: 'steam' };
  }
}
