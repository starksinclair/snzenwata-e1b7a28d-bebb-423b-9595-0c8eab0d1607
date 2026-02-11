import { Injectable } from '@nestjs/common';
import {
  registerDecorator,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';
import { DataSource, EntitySchema, ObjectType } from 'typeorm';

let dataSourceRef: DataSource | null = null;

export function setDataSourceForIsUnique(dataSource: DataSource) {
  dataSourceRef = dataSource;
}

@ValidatorConstraint({ async: true })
@Injectable()
export class IsUniqueConstraint implements ValidatorConstraintInterface {
  constructor(private dataSource?: DataSource) {}

  async validate(value: string, args: ValidationArguments) {
    const [entityClass, property] = args.constraints;

    if (!value) return true; // Let @IsOptional handle empty values

    const dataSource = this.dataSource ?? dataSourceRef;
    if (!dataSource) {
      throw new Error(
        'IsExistsConstraint: DataSource not available. Call setDataSourceForIsExists() in AppModule.onModuleInit().',
      );
    }
    const repository = dataSource.getRepository(entityClass);
    const entity = await repository.count({
      where: { [property]: value },
    });

    return entity === 0;
  }

  defaultMessage(args: ValidationArguments) {
    const [property] = args.constraints;
    return `This ${property} is already taken`;
  }
}

export function IsUnique(
  entityClass: EntitySchema<unknown> | ObjectType<unknown>,
  property: string,
) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: {
        message: `This ${property} is already taken`,
      },
      constraints: [entityClass, property],
      validator: IsUniqueConstraint,
    });
  };
}
