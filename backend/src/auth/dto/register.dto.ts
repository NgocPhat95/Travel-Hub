import { IsEmail, IsString, Matches, MinLength } from 'class-validator';

export class RegisterDto {
  @IsEmail({}, { message: 'Email không đúng định dạng.' })
  email: string;

  @IsString()
  @MinLength(2, { message: 'Họ và tên phải có ít nhất 2 ký tự.' })
  fullName: string;

  @IsString()
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/, {
    message: 'Mật khẩu phải có ít nhất 8 ký tự, gồm chữ HOA, chữ thường và số.',
  })
  password: string;
}

