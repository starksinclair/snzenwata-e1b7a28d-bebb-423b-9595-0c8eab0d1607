import { PartialType } from '@nestjs/mapped-types';
import { CreateAuditsLogDto } from './create-audits-log.dto';

export class UpdateAuditsLogDto extends PartialType(CreateAuditsLogDto) {}
