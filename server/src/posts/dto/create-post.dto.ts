import {
  IsString,
  IsOptional,
  IsEnum,
  IsArray,
  ValidateNested,
  IsInt,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';

export class PostMediaDto {
  @IsString()
  media_url: string;

  @IsString()
  @IsOptional()
  media_type?: string = 'image';

  @IsString()
  @IsOptional()
  thumbnail_url?: string;

  @IsInt()
  @IsOptional()
  duration?: number;
}

export class CreatePostDto {
  @IsString()
  @IsOptional()
  @MaxLength(1000)
  caption?: string;

  @IsString()
  @IsOptional()
  location?: string;

  @IsString()
  @IsOptional()
  @IsEnum(['public', 'private'])
  visibility?: string = 'public';

  @IsString()
  @IsOptional()
  sector_id?: string;

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => PostMediaDto)
  media?: PostMediaDto[];
}
