import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  Req,
  Put,
} from '@nestjs/common';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { PermissionsGuard } from '../guards/permissions.guard';
import { RequirePermissions } from '../decorators/permissions.decorator';
import {
  JwtPayload,
  Permission,
} from '@snzenwata-e1b7a28d-bebb-423b-9595-0c8eab0d1607/data';

@Controller('tasks')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  @RequirePermissions(Permission.TASK_CREATE)
  create(
    @Req() req: { user: JwtPayload },
    @Body() createTaskDto: CreateTaskDto,
  ) {
    return this.tasksService.create(req.user, createTaskDto);
  }

  @Get()
  @RequirePermissions(Permission.TASK_READ)
  findAll(@Req() req: { user: JwtPayload }) {
    return this.tasksService.findAll(req.user);
  }

  @Get(':id')
  @RequirePermissions(Permission.TASK_READ)
  findOne(@Req() req: { user: JwtPayload }, @Param('id') id: string) {
    return this.tasksService.findOne(req.user, id);
  }

  @Put(':id')
  @RequirePermissions(Permission.TASK_UPDATE)
  update(
    @Req() req: { user: JwtPayload },
    @Param('id') id: string,
    @Body() updateTaskDto: UpdateTaskDto,
  ) {
    return this.tasksService.update(req.user, id, updateTaskDto);
  }

  @Delete(':id')
  @RequirePermissions(Permission.TASK_DELETE)
  remove(@Req() req: { user: JwtPayload }, @Param('id') id: string) {
    return this.tasksService.remove(req.user, id);
  }
}
