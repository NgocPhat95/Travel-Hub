import { IsEmail, IsString, Matches, MinLength } from 'class-validator';

export class RegisterDto {
  @IsEmail({}, { message: 'Email is not valid.' })
  email: string;

  @IsString()
  @MinLength(2, { message: 'Full name must be at least 2 characters.' })
  fullName: string;

  @IsString()
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/, {
    message:
      'Password must be at least 8 characters and include uppercase, lowercase, and a number.',
  })
  password: string;
}
