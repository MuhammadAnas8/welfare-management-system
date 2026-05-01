import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class SignupDto {

  @ApiProperty({ example: 'Muhammad Ali' })
  @IsString()
  name!: string;

  @ApiProperty({ example: 'test@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ minLength: 6 })
  @IsString()
  @MinLength(6)
  password!: string;
}
