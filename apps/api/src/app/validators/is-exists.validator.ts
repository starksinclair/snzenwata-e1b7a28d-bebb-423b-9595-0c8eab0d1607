import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';
import { Injectable } from '@nestjs/common';
import { DataSource, EntitySchema, ObjectType } from 'typeorm';

export type ExistsMode = 'exists' | 'notExists';

let dataSourceRef: DataSource | null = null;

export function setDataSourceForIsExists(dataSource: DataSource) {
  dataSourceRef = dataSource;
}

@ValidatorConstraint({ async: true })
@Injectable()
export class IsExistsConstraint implements ValidatorConstraintInterface {
  constructor(private dataSource?: DataSource) {}

  async validate(value: string, args: ValidationArguments) {
    const [entityClass, property, mode] = args.constraints;
    const column = property ?? 'id';
    const existsMode: ExistsMode = (mode as ExistsMode) ?? 'exists';

    if (!value) return true; // Let @IsOptional handle empty values

    const dataSource = this.dataSource ?? dataSourceRef;
    if (!dataSource) {
      throw new Error(
        'IsExistsConstraint: DataSource not available. Call setDataSourceForIsExists() in AppModule.onModuleInit().',
      );
    }
    const repository = dataSource.getRepository(entityClass);
    const entity = await repository.findOne({
      where: { [column]: value },
    });

    const found = !!entity;
    return existsMode === 'notExists' ? !found : found;
  }

  defaultMessage(args: ValidationArguments) {
    const [entityClass, , mode] = args.constraints;
    const existsMode: ExistsMode = (mode as ExistsMode) ?? 'exists';
    const prop = args.property;
    if (existsMode === 'notExists') {
      return `${entityClass.name} with this ${prop} already exists`;
    }
    return `${entityClass.name} with this ${prop} does not exist`;
  }
}

export function IsExists(
  entityClass: EntitySchema<unknown> | ObjectType<unknown>,
  property?: string,
  validationOptions?: ValidationOptions,
) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [entityClass, property, 'exists' as ExistsMode],
      validator: IsExistsConstraint,
    });
  };
}

export function IsNotExists(
  entityClass: EntitySchema<unknown> | ObjectType<unknown>,
  property?: string,
  validationOptions?: ValidationOptions,
) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [entityClass, property, 'notExists' as ExistsMode],
      validator: IsExistsConstraint,
    });
  };
}
