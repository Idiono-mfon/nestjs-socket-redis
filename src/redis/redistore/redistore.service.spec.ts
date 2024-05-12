import { Test, TestingModule } from '@nestjs/testing';
import { RedistoreService } from './redistore.service';

describe('RedistoreService', () => {
  let service: RedistoreService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RedistoreService],
    }).compile();

    service = module.get<RedistoreService>(RedistoreService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
