import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserConnection } from './entities/user-connection.entity';
import { ConnectionsController } from './connections.controller';
import { ConnectionsService } from './connections.service';
import { SpotifyOAuthService } from './spotify-oauth.service';
import { SteamOAuthService } from './steam-oauth.service';

@Module({
  imports: [TypeOrmModule.forFeature([UserConnection])],
  controllers: [ConnectionsController],
  providers: [ConnectionsService, SpotifyOAuthService, SteamOAuthService],
  exports: [ConnectionsService, SpotifyOAuthService],
})
export class ConnectionsModule {}
