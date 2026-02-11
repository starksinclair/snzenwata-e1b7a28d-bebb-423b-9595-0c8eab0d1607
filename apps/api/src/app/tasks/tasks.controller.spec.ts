import { Test, TestingModule } from '@nestjs/testing';
import {
  ExecutionContext,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { PermissionsGuard } from '../guards/permissions.guard';
import {
  JwtPayload,
  Role,
  TaskCategory,
  TaskStatus,
} from '@snzenwata-e1b7a28d-bebb-423b-9595-0c8eab0d1607/data';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

const mockJwtPayload: JwtPayload = {
  sub: 'user-uuid-1',
  email: 'user@example.com',
  role: Role.ADMIN,
  orgId: 'org-uuid-1',
};

const mockTask = {
  id: 'task-uuid-1',
  title: 'Test Task',
  description: 'Desc',
  category: TaskCategory.WORK,
  status: TaskStatus.TODO,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockTasksService = {
  create: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
};

function createMockExecutionContext(
  handler: (..._args: unknown[]) => unknown,
  controllerClass: unknown,
  request: { user?: JwtPayload },
): ExecutionContext {
  return {
    getHandler: () => handler,
    getClass: () => controllerClass,
    switchToHttp: () => ({
      getRequest: () => request,
    }),
  } as unknown as ExecutionContext;
}

describe('TasksController', () => {
  let controller: TasksController;
  let service: TasksService;
  let permissionsGuard: PermissionsGuard;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TasksController],
      providers: [
        { provide: TasksService, useValue: mockTasksService },
        Reflector,
        PermissionsGuard,
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<TasksController>(TasksController);
    service = module.get<TasksService>(TasksService);
    permissionsGuard = module.get<PermissionsGuard>(PermissionsGuard);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('controller methods (guards assumed passing)', () => {
    const createDto: CreateTaskDto = {
      title: 'New Task',
      description: 'Optional',
      category: TaskCategory.WORK,
      status: TaskStatus.TODO,
    };
    const updateDto: UpdateTaskDto = { title: 'Updated Title' };
    const req: { user: JwtPayload } = { user: mockJwtPayload };

    it('create() should call service.create and return task', async () => {
      mockTasksService.create.mockResolvedValue(mockTask);
      const result = await controller.create(req, createDto);
      expect(service.create).toHaveBeenCalledWith(mockJwtPayload, createDto);
      expect(result).toEqual(mockTask);
    });

    it('findAll() should call service.findAll and return tasks', async () => {
      const tasks = [mockTask];
      mockTasksService.findAll.mockResolvedValue(tasks);
      const result = await controller.findAll(req);
      expect(service.findAll).toHaveBeenCalledWith(mockJwtPayload);
      expect(result).toEqual(tasks);
    });

    it('findOne() should call service.findOne and return task', async () => {
      mockTasksService.findOne.mockResolvedValue(mockTask);
      const result = await controller.findOne(req, mockTask.id);
      expect(service.findOne).toHaveBeenCalledWith(mockJwtPayload, mockTask.id);
      expect(result).toEqual(mockTask);
    });

    it('findOne() should throw when service throws NotFoundException', async () => {
      mockTasksService.findOne.mockRejectedValue(
        new NotFoundException('Task not found'),
      );
      await expect(controller.findOne(req, 'missing-id')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('update() should call service.update and return task', async () => {
      const updated = { ...mockTask, ...updateDto };
      mockTasksService.update.mockResolvedValue(updated);
      const result = await controller.update(req, mockTask.id, updateDto);
      expect(service.update).toHaveBeenCalledWith(
        mockJwtPayload,
        mockTask.id,
        updateDto,
      );
      expect(result).toEqual(updated);
    });

    it('update() should throw when service throws NotFoundException', async () => {
      mockTasksService.update.mockRejectedValue(
        new NotFoundException('Task not found'),
      );
      await expect(
        controller.update(req, 'missing-id', updateDto),
      ).rejects.toThrow(NotFoundException);
    });

    it('remove() should call service.remove and return void', async () => {
      mockTasksService.remove.mockResolvedValue(undefined);
      await controller.remove(req, mockTask.id);
      expect(service.remove).toHaveBeenCalledWith(mockJwtPayload, mockTask.id);
    });

    it('remove() should throw when service throws NotFoundException', async () => {
      mockTasksService.remove.mockRejectedValue(
        new NotFoundException('Task not found'),
      );
      await expect(controller.remove(req, 'missing-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('PermissionsGuard (permission checks)', () => {
    it('should allow when user role has required permission (ADMIN has TASK_CREATE)', () => {
      const ctx = createMockExecutionContext(
        TasksController.prototype.create,
        TasksController,
        { user: { ...mockJwtPayload, role: Role.ADMIN } },
      );
      expect(permissionsGuard.canActivate(ctx)).toBe(true);
    });

    it('should allow when user role has required permission (OWNER has TASK_READ)', () => {
      const ctx = createMockExecutionContext(
        TasksController.prototype.findAll,
        TasksController,
        { user: { ...mockJwtPayload, role: Role.OWNER } },
      );
      expect(permissionsGuard.canActivate(ctx)).toBe(true);
    });

    it('should throw ForbiddenException when user role lacks permission (VIEWER and TASK_CREATE)', () => {
      const ctx = createMockExecutionContext(
        TasksController.prototype.create,
        TasksController,
        { user: { ...mockJwtPayload, role: Role.VIEWER } },
      );
      expect(() => permissionsGuard.canActivate(ctx)).toThrow(
        ForbiddenException,
      );
    });

    it('should throw ForbiddenException when user role lacks permission (VIEWER and TASK_DELETE)', () => {
      const ctx = createMockExecutionContext(
        TasksController.prototype.remove,
        TasksController,
        { user: { ...mockJwtPayload, role: Role.VIEWER } },
      );
      expect(() => permissionsGuard.canActivate(ctx)).toThrow(
        ForbiddenException,
      );
    });

    it('should throw ForbiddenException when req.user is missing', () => {
      const ctx = createMockExecutionContext(
        TasksController.prototype.create,
        TasksController,
        {},
      );
      expect(() => permissionsGuard.canActivate(ctx)).toThrow(
        ForbiddenException,
      );
    });

    it('should throw ForbiddenException when req.user.role is missing', () => {
      const ctx = createMockExecutionContext(
        TasksController.prototype.create,
        TasksController,
        { user: { sub: 'u1', email: 'e@e.com', orgId: 'o1' } as JwtPayload }, // role missing at runtime
      );
      expect(() => permissionsGuard.canActivate(ctx)).toThrow(
        ForbiddenException,
      );
    });

    it('should allow VIEWER for TASK_READ (findOne)', () => {
      const ctx = createMockExecutionContext(
        TasksController.prototype.findOne,
        TasksController,
        { user: { ...mockJwtPayload, role: Role.VIEWER } },
      );
      expect(permissionsGuard.canActivate(ctx)).toBe(true);
    });
  });
});
