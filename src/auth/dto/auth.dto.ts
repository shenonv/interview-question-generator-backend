import { IsEmail, IsString, MinLength, IsOptional } from 'class-validator';

export class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;
}

export class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsString()
  fullName: string;

  @IsOptional()
  @IsString()
  avatar?: string;
}

export class AuthResponseDto {
  accessToken: string;
  user: {
    id: number;
    email: string;
    fullName: string;
    avatar?: string;
  };
} 