import { IsString, IsOptional, IsNotEmpty, IsEnum } from 'class-validator';
import {
  TaskCategory,
  TaskStatus,
} from '@snzenwata-e1b7a28d-bebb-423b-9595-0c8eab0d1607/data';

export class CreateTaskDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(TaskCategory)
  @IsNotEmpty()
  category: TaskCategory;

  @IsEnum(TaskStatus)
  @IsNotEmpty()
  status: TaskStatus;
}
