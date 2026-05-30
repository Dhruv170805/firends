import { IsString, IsNotEmpty, IsUUID } from 'class-validator';

export class JoinSectorDto {
  @IsString()
  @IsNotEmpty()
  @IsUUID(4, {
    message: 'Invalid Sector Access Code. Code must be a valid UUID.',
  })
  inviteCode: string;
}
