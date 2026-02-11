import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException, ConflictException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersService } from '../user/users.service';
import { JwtService } from '@nestjs/jwt';
import { OrganizationService } from '../organization/organization.service';
import { DataSource } from 'typeorm';
import { AuditsLogsService } from '../audit-logs/audits-logs.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { User } from '../user/entities/user.entity';
import { Organization } from '../organization/entities/organization.entity';
import {
  Role,
  OrganizationType,
} from '@snzenwata-e1b7a28d-bebb-423b-9595-0c8eab0d1607/data';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

describe('AuthService', () => {
  let service: AuthService;
  let usersService: UsersService;
  let jwtService: JwtService;
  let organizationsService: OrganizationService;
  let dataSource: DataSource;

  const mockOrganization: Organization = {
    id: 'org-uuid-1',
    type: OrganizationType.COMPANY,
    name: 'Test Org',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockUser: User = {
    id: 'user-uuid-1',
    email: 'user@example.com',
    passwordHash: 'hashed-password',
    organization: mockOrganization,
    role: Role.OWNER,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockUsersService = {
    findByEmail: jest.fn(),
    findByEmailWithOrganization: jest.fn(),
    create: jest.fn(),
  };

  const mockJwtService = {
    signAsync: jest.fn(),
  };

  const mockOrganizationsService = {
    create: jest.fn(),
  };

  const mockTransaction = jest.fn();

  const mockDataSource = {
    transaction: mockTransaction,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: OrganizationService, useValue: mockOrganizationsService },
        { provide: DataSource, useValue: mockDataSource },
        { provide: AuditsLogsService, useValue: { logAction: jest.fn() } },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);
    jwtService = module.get<JwtService>(JwtService);
    organizationsService = module.get<OrganizationService>(OrganizationService);
    dataSource = module.get<DataSource>(DataSource);

    jest.clearAllMocks();
    (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('login', () => {
    const loginDto: LoginDto = {
      email: 'user@example.com',
      password: 'password123',
    };

    it('should throw UnauthorizedException when user is not found', async () => {
      mockUsersService.findByEmailWithOrganization.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(usersService.findByEmailWithOrganization).toHaveBeenCalledWith(
        loginDto.email,
      );
      expect(bcrypt.compare).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException when password is invalid', async () => {
      mockUsersService.findByEmailWithOrganization.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(bcrypt.compare).toHaveBeenCalledWith(
        loginDto.password,
        mockUser.passwordHash,
      );
      expect(jwtService.signAsync).not.toHaveBeenCalled();
    });

    it('should return access token when credentials are valid', async () => {
      mockUsersService.findByEmailWithOrganization.mockResolvedValue(mockUser);
      mockJwtService.signAsync.mockResolvedValue('jwt-token');

      const result = await service.login(loginDto);

      expect(usersService.findByEmailWithOrganization).toHaveBeenCalledWith(
        loginDto.email,
      );
      expect(bcrypt.compare).toHaveBeenCalledWith(
        loginDto.password,
        mockUser.passwordHash,
      );
      expect(jwtService.signAsync).toHaveBeenCalledWith({
        email: mockUser.email,
        sub: mockUser.id,
        role: mockUser.role,
        orgId: mockOrganization.id,
      });
      expect(result).toEqual({ accessToken: 'jwt-token' });
    });
  });

  describe('register', () => {
    const registerDto: RegisterDto = {
      email: 'new@example.com',
      password: 'password123',
      org_name: 'New Organization',
    };

    it('should throw ConflictException when user already exists', async () => {
      mockUsersService.findByEmail.mockResolvedValue(mockUser);

      await expect(service.register(registerDto)).rejects.toThrow(
        ConflictException,
      );
      expect(usersService.findByEmail).toHaveBeenCalledWith(registerDto.email);
      expect(dataSource.transaction).not.toHaveBeenCalled();
    });

    it('should create organization and user in transaction and return access token', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);
      mockOrganizationsService.create.mockResolvedValue(mockOrganization);
      mockUsersService.create.mockResolvedValue({
        ...mockUser,
        email: registerDto.email,
        organization: mockOrganization,
      });
      mockJwtService.signAsync.mockResolvedValue('new-jwt-token');
      mockTransaction.mockImplementation(
        async (fn: (manager: unknown) => Promise<unknown>) => {
          return fn({});
        },
      );

      const result = await service.register(registerDto);

      expect(usersService.findByEmail).toHaveBeenCalledWith(registerDto.email);
      expect(bcrypt.hash).toHaveBeenCalledWith(registerDto.password, 10);
      expect(dataSource.transaction).toHaveBeenCalled();
      expect(organizationsService.create).toHaveBeenCalledWith(
        { name: registerDto.org_name },
        {},
      );
      expect(usersService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          email: registerDto.email,
          passwordHash: 'hashed-password',
          role: Role.OWNER,
        }),
        {},
      );
      expect(jwtService.signAsync).toHaveBeenCalled();
      expect(result).toEqual({ accessToken: 'new-jwt-token' });
    });
  });
});
