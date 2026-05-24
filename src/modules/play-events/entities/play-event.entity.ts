import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('play_events')
@Index(['userId', 'trackId', 'playedAt'])
export class PlayEvent {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column()
  userId!: string;

  @Column()
  trackId!: string;

  @Column({ type: 'timestamptz' })
  playedAt!: Date;

  @CreateDateColumn()
  createdAt!: Date;
}
