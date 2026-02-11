import { IsString, IsNotEmpty } from 'class-validator';
import { IsUnique } from '../../validators/is-unique.validator';
import { Organization } from '../entities/organization.entity';

export class CreateOrganizationDto {
  @IsString()
  @IsNotEmpty()
  @IsUnique(Organization, 'name')
  name: string;
}
