import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UsersService } from '../user/users.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { OrganizationService } from '../organization/organization.service';
import { User } from '../user/entities/user.entity';
import {
  AuditAction,
  AuditReason,
  Role,
} from '@snzenwata-e1b7a28d-bebb-423b-9595-0c8eab0d1607/data';
import { DataSource } from 'typeorm';
import { AuditsLogsService } from '../audit-logs/audits-logs.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly organizationsService: OrganizationService,
    private readonly dataSource: DataSource,
    private readonly auditsLogsService: AuditsLogsService,
  ) {}

  async login(loginDto: LoginDto): Promise<{ accessToken: string }> {
    const user = await this.usersService.findByEmailWithOrganization(
      loginDto.email,
    );
    if (!user) {
      await this.auditsLogsService.logAction({
        action: AuditAction.LOGIN_FAIL,
        success: false,
        actorUserId: null,
        actorOrgId: null,
        reason: AuditReason.INVALID_CREDENTIALS,
      });
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await this.comparePassword(
      loginDto.password,
      user.passwordHash,
    );
    if (!isPasswordValid) {
      await this.auditsLogsService.logAction({
        action: AuditAction.LOGIN_FAIL,
        success: false,
        actorUserId: user.id,
        actorOrgId: user.organization.id,
        reason: AuditReason.INVALID_CREDENTIALS,
      });
      throw new UnauthorizedException('Invalid credentials');
    }
    const accessToken = await this.generateAccessToken(user);
    await this.auditsLogsService.logAction({
      action: AuditAction.LOGIN_SUCCESS,
      success: true,
      actorUserId: user.id,
      actorOrgId: user.organization.id,
      reason: null,
    });
    return { accessToken };
  }

  async register(registerDto: RegisterDto): Promise<{ accessToken: string }> {
    const existingUser = await this.usersService.findByEmail(registerDto.email);
    if (existingUser) {
      await this.auditsLogsService.logAction({
        action: AuditAction.REGISTER_FAIL,
        success: false,
        actorUserId: null,
        actorOrgId: null,
        reason: AuditReason.USER_ALREADY_EXISTS,
      });
      throw new ConflictException('User already exists');
    }

    const hashedPassword = await this.hashPassword(registerDto.password);

    const user = await this.dataSource.transaction(async (manager) => {
      const organization = await this.organizationsService.create(
        { name: registerDto.org_name },
        manager,
      );

      const createdUser = await this.usersService.create(
        {
          email: registerDto.email,
          passwordHash: hashedPassword,
          organization,
          role: Role.OWNER,
        },
        manager,
      );

      return { organization, user: createdUser };
    });
    await this.auditsLogsService.logAction({
      action: AuditAction.ORG_CREATE,
      success: true,
      actorUserId: user.user.id,
      actorOrgId: user.organization.id,
      reason: null,
    });
    await this.auditsLogsService.logAction({
      action: AuditAction.USER_CREATE,
      success: true,
      actorUserId: user.user.id,
      actorOrgId: user.organization.id,
      reason: null,
    });

    const accessToken = await this.generateAccessToken(user.user);
    await this.auditsLogsService.logAction({
      action: AuditAction.REGISTER_SUCCESS,
      success: true,
      actorUserId: user.user.id,
      actorOrgId: user.organization.id,
      reason: null,
    });
    return { accessToken };
  }

  private async hashPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, 10);
  }

  private async comparePassword(
    password: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return await bcrypt.compare(password, hashedPassword);
  }

  private async generateAccessToken(user: User): Promise<string> {
    const payload = {
      email: user.email,
      sub: user.id,
      role: user.role,
      orgId: user.organization.id,
    };
    return await this.jwtService.signAsync(payload);
  }
}
