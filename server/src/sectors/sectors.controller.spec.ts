import { Test, TestingModule } from '@nestjs/testing';
import { SectorsController } from './sectors.controller';
import { SectorsService } from './sectors.service';
import { SupabaseService } from '../supabase/supabase.service';

describe('SectorsController', () => {
  let controller: SectorsController;

  beforeEach(async () => {
    const mockSectorsService = {
      createSector: jest.fn(),
      getSectors: jest.fn(),
      addMember: jest.fn(),
      getMembers: jest.fn(),
      getPosts: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [SectorsController],
      providers: [
        {
          provide: SectorsService,
          useValue: mockSectorsService,
        },
        {
          provide: SupabaseService,
          useValue: {
            getClient: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<SectorsController>(SectorsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
