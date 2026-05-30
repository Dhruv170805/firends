import { IsNotEmpty, IsOptional, IsString, IsEnum } from 'class-validator';

export class CreateStoryDto {
  @IsString()
  @IsNotEmpty()
  media_url: string;

  @IsString()
  @IsOptional()
  @IsEnum(['image', 'video'])
  media_type?: string = 'image';
}
