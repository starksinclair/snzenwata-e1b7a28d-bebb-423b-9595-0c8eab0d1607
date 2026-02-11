import { Role } from '../enums/task.enum';

export type JwtPayload = {
  sub: string;
  email: string;
  role: Role;
  orgId: string;
};
