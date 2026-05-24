import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class ValidateMissionBodyDto {
  @IsOptional()
  @IsString()
  code?: string;

  @IsOptional()
  @IsBoolean()
  async?: boolean;
}
