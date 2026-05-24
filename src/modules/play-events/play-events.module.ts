import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlayEvent } from './entities/play-event.entity';
import { PlayEventsService } from './play-events.service';

@Module({
  imports: [TypeOrmModule.forFeature([PlayEvent])],
  providers: [PlayEventsService],
  exports: [PlayEventsService],
})
export class PlayEventsModule {}
