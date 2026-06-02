import { IsString, Matches, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @IsString()
  @MinLength(20, { message: 'Token is not valid.' })
  token: string;

  @IsString()
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/, {
    message:
      'Password must be at least 8 characters and include uppercase, lowercase, and a number.',
  })
  newPassword: string;
}
