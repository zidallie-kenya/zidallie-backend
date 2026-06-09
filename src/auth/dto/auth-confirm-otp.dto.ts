import { IsEmail, IsString, Length } from 'class-validator';

export class AuthConfirmOtpDto {
  @IsEmail()
  email!: string;

  @IsString()
  @Length(6, 6)
  otp!: string;
}
