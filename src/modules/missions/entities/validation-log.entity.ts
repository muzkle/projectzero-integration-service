import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { MissionType } from '@muzkle/contracts';

@Entity('validation_logs')
export class ValidationLog {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column()
  userId!: string;

  @Index()
  @Column()
  missionId!: string;

  @Column({ type: 'varchar', length: 64 })
  missionType!: MissionType;

  @Column()
  completed!: boolean;

  @Column({ type: 'jsonb', default: {} })
  details!: Record<string, unknown>;

  @CreateDateColumn()
  createdAt!: Date;
}
