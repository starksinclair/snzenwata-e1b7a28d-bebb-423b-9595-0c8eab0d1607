import { Test, TestingModule } from '@nestjs/testing';
import { AuditsLogsController } from './audits-logs.controller';
import { AuditsLogsService } from './audits-logs.service';

describe('AuditsLogsController', () => {
  let controller: AuditsLogsController;

  const mockService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    logAction: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuditsLogsController],
      providers: [{ provide: AuditsLogsService, useValue: mockService }],
    }).compile();

    controller = module.get<AuditsLogsController>(AuditsLogsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
