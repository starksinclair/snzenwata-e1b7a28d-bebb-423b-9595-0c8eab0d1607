import { IsEmail, IsString, MinLength, IsNotEmpty } from 'class-validator';
import { Organization } from '../../organization/entities/organization.entity';
import { IsUnique } from '../../validators/is-unique.validator';
import { IsNotExists } from '../../validators/is-exists.validator';

export class RegisterDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @MinLength(6)
  @IsNotEmpty()
  password: string;

  @IsString()
  @IsNotEmpty()
  @IsUnique(Organization, 'name')
  @IsNotExists(Organization, 'name')
  org_name: string;
}
