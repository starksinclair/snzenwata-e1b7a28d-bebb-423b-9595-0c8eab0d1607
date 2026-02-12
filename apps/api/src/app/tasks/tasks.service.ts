import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import {
  AuditAction,
  AuditReason,
  AuditResourceType,
  JwtPayload,
} from '@snzenwata-e1b7a28d-bebb-423b-9595-0c8eab0d1607/data';
import {
  Permission,
  ROLE_PERMISSIONS,
} from '@snzenwata-e1b7a28d-bebb-423b-9595-0c8eab0d1607/auth';
import { InjectRepository } from '@nestjs/typeorm';
import { Task } from './entities/task.entity';
import { In, Repository } from 'typeorm';
import { AuditsLogsService } from '../audit-logs/audits-logs.service';
import { OrganizationService } from '../organization/organization.service';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private readonly tasksRepository: Repository<Task>,
    private readonly auditsLogsService: AuditsLogsService,
    private readonly organizationService: OrganizationService,
  ) {}

  async create(jwtPayload: JwtPayload, createTaskDto: CreateTaskDto) {
    this.assertPermission(jwtPayload, Permission.TASK_CREATE);
    const task = this.tasksRepository.create({
      ...createTaskDto,
      organization: { id: jwtPayload.orgId },
      owner: { id: jwtPayload.sub },
    });
    const savedTask = await this.tasksRepository.save(task);
    await this.auditsLogsService.logAction({
      action: AuditAction.TASK_CREATE,
      success: true,
      actorUserId: jwtPayload.sub,
      actorOrgId: jwtPayload.orgId,
      resourceType: AuditResourceType.TASK,
      resourceId: savedTask.id,
      reason: null,
    });
    return savedTask;
  }

  async findAll(jwtPayload: JwtPayload) {
    this.assertPermission(jwtPayload, Permission.TASK_READ);
    const allowedOrgIds = await this.allowedOrgIdsFor(jwtPayload);
    const tasks = await this.tasksRepository.find({
      where: { organization: { id: In(allowedOrgIds) } },
      relations: ['organization', 'owner'],
    });
    await this.auditsLogsService.logAction({
      action: AuditAction.TASK_READ,
      success: true,
      actorUserId: jwtPayload.sub,
      actorOrgId: jwtPayload.orgId,
      resourceType: AuditResourceType.TASK,
      reason: null,
    });
    return tasks;
  }

  async findOne(jwtPayload: JwtPayload, id: string) {
    this.assertPermission(jwtPayload, Permission.TASK_READ);
    const allowedOrgIds = await this.allowedOrgIdsFor(jwtPayload);
    const task = await this.tasksRepository.findOne({
      where: { id, organization: { id: In(allowedOrgIds) } },
      relations: ['organization', 'owner'],
    });
    if (!task) {
      await this.auditsLogsService.logAction({
        action: AuditAction.TASK_READ,
        success: false,
        actorUserId: jwtPayload.sub,
        actorOrgId: jwtPayload.orgId,
        resourceType: AuditResourceType.TASK,
        resourceId: id,
        reason: AuditReason.RESOURCE_NOT_FOUND,
      });
      throw new NotFoundException('Task not found');
    }
    await this.auditsLogsService.logAction({
      action: AuditAction.TASK_READ,
      success: true,
      actorUserId: jwtPayload.sub,
      actorOrgId: jwtPayload.orgId,
      resourceType: AuditResourceType.TASK,
      resourceId: task.id,
      reason: null,
    });
    return task;
  }

  async update(
    jwtPayload: JwtPayload,
    id: string,
    updateTaskDto: UpdateTaskDto,
  ) {
    this.assertPermission(jwtPayload, Permission.TASK_UPDATE);
    const allowedOrgIds = await this.allowedOrgIdsFor(jwtPayload);
    const task = await this.tasksRepository.findOne({
      where: { id, organization: { id: In(allowedOrgIds) } },
      relations: ['organization', 'owner'],
    });
    if (!task) {
      throw new NotFoundException('Task not found');
    }
    Object.assign(task, updateTaskDto);
    const updated = await this.tasksRepository.save(task);
    await this.auditsLogsService.logAction({
      action: AuditAction.TASK_UPDATE,
      success: true,
      actorUserId: jwtPayload.sub,
      actorOrgId: jwtPayload.orgId,
      resourceType: AuditResourceType.TASK,
      resourceId: updated.id,
      reason: null,
    });
    return updated;
  }

  async remove(jwtPayload: JwtPayload, id: string) {
    this.assertPermission(jwtPayload, Permission.TASK_DELETE);
    const allowedOrgIds = await this.allowedOrgIdsFor(jwtPayload);
    const task = await this.tasksRepository.findOne({
      where: { id, organization: { id: In(allowedOrgIds) } },
      relations: ['organization', 'owner'],
    });
    if (!task) {
      throw new NotFoundException('Task not found');
    }
    await this.tasksRepository.delete(id);
    await this.auditsLogsService.logAction({
      action: AuditAction.TASK_DELETE,
      success: true,
      actorUserId: jwtPayload.sub,
      actorOrgId: jwtPayload.orgId,
      resourceType: AuditResourceType.TASK,
      resourceId: task.id,
      reason: null,
    });
    return task;
  }

  hasPermission(user: JwtPayload, permission: Permission): boolean {
    const granted = ROLE_PERMISSIONS[user.role] ?? [];
    return granted.includes(permission);
  }

  assertPermission(user: JwtPayload, permission: Permission): void {
    if (!this.hasPermission(user, permission)) {
      throw new ForbiddenException(AuditReason.PERMISSION_MISSING);
    }
  }

  private async allowedOrgIdsFor(user: JwtPayload): Promise<string[]> {
    return this.organizationService.getAllowedOrgIds(user.orgId);
  }
}
