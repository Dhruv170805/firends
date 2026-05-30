import {
  IsString,
  IsOptional,
  IsInt,
  Min,
  Max,
  MaxLength,
} from 'class-validator';

export class UpdateUserDto {
  @IsString()
  @IsOptional()
  @MaxLength(50)
  username?: string;

  @IsString()
  @IsOptional()
  avatar_url?: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  bio?: string;

  @IsString()
  @IsOptional()
  college_id?: string;

  @IsInt()
  @IsOptional()
  @Min(1900)
  @Max(2100)
  batch_year?: number;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  full_name?: string;

  @IsString()
  @IsOptional()
  @MaxLength(30)
  phone?: string;
}
