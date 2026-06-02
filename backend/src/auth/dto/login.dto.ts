import { IsEmail, IsString, Matches } from 'class-validator';

export class LoginDto {
  @IsEmail({}, { message: 'Email is not valid.' })
  email: string;

  @IsString()
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/, {
    message:
      'Password must be at least 8 characters and include uppercase, lowercase, and a number.',
  })
  password: string;
}
