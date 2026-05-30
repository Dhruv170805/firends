import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';
import { SupabaseService } from '../supabase/supabase.service';

describe('HealthController', () => {
  let controller: HealthController;

  beforeEach(async () => {
    const mockHealthService = {
      getHeartbeat: jest.fn().mockReturnValue({ status: 'ok' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: HealthService,
          useValue: mockHealthService,
        },
        {
          provide: SupabaseService,
          useValue: {
            getClient: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
