import { Test, TestingModule } from '@nestjs/testing';
import { TipService } from './tip.service';

describe('TipService', () => {
  let service: TipService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TipService],
    }).compile();

    service = module.get<TipService>(TipService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
