import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  Unique,
} from 'typeorm';

export type ConnectionProvider = 'spotify' | 'steam';

@Entity('user_connections')
@Unique(['userId', 'provider'])
export class UserConnection {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column()
  userId!: string;

  @Column({ type: 'varchar', length: 32 })
  provider!: ConnectionProvider;

  @Column({ type: 'text' })
  accessToken!: string;

  @Column({ type: 'text', nullable: true })
  refreshToken?: string;

  @Column({ type: 'text', nullable: true })
  scopes?: string;

  @Column({ type: 'timestamptz', nullable: true })
  expiresAt?: Date;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
