import { Test, TestingModule } from '@nestjs/testing';
import { EmailGateway } from './email.gateway';

describe('EmailGateway', () => {
  let gateway: EmailGateway;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EmailGateway],
    }).compile();

    gateway = module.get<EmailGateway>(EmailGateway);
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });
});
