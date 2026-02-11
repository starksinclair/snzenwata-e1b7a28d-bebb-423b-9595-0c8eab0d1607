import { IsString, IsOptional, IsEnum } from 'class-validator';
import {
  TaskCategory,
  TaskStatus,
} from '@snzenwata-e1b7a28d-bebb-423b-9595-0c8eab0d1607/data';

export class UpdateTaskDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(TaskCategory)
  @IsOptional()
  category?: TaskCategory;

  @IsEnum(TaskStatus)
  @IsOptional()
  status?: TaskStatus;
}
