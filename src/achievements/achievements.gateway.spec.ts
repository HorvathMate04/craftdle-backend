import { Test, TestingModule } from '@nestjs/testing';
import { AchievementsGateway } from './achievements.gateway';

describe('AchievementsGateway', () => {
  let gateway: AchievementsGateway;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AchievementsGateway],
    }).compile();

    gateway = module.get<AchievementsGateway>(AchievementsGateway);
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });
});
