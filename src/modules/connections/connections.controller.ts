import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { UserIdGuard } from '../../common/guards/user-id.guard';
import { UserId } from '../../common/decorators/user-id.decorator';
import { ConnectionsService } from './connections.service';
import { SpotifyOAuthService } from './spotify-oauth.service';
import { SteamOAuthService } from './steam-oauth.service';

@Controller('connections')
export class ConnectionsController {
  constructor(
    private connectionsService: ConnectionsService,
    private spotifyOAuth: SpotifyOAuthService,
    private steamOAuth: SteamOAuthService,
  ) {}

  @Get()
  @UseGuards(UserIdGuard)
  async listConnections(@UserId() userId: string) {
    const connections = await this.connectionsService.listByUser(userId);
    return connections.map((c) => this.connectionsService.toPublicDto(c));
  }

  @Get('spotify/authorize')
  @UseGuards(UserIdGuard)
  authorizeSpotify(@UserId() userId: string) {
    return { authUrl: this.spotifyOAuth.buildAuthorizeUrl(userId) };
  }

  @Get('spotify/callback')
  async spotifyCallback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Res() res: Response,
  ) {
    await this.spotifyOAuth.handleCallback(code, state);
    return res.redirect('/connections?provider=spotify&status=connected');
  }

  @Get('steam/authorize')
  @UseGuards(UserIdGuard)
  authorizeSteam(@UserId() userId: string) {
    return { authUrl: this.steamOAuth.buildAuthorizeUrl(userId) };
  }

  @Get('steam/callback')
  async steamCallback(
    @Query('state') state: string,
    @Query('openid.claimed_id') claimedId: string,
    @Res() res: Response,
  ) {
    const steamId = claimedId?.split('/').pop();
    await this.steamOAuth.handleCallback(state, steamId);
    return res.redirect('/connections?provider=steam&status=connected');
  }
}
