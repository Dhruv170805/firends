import { Test, TestingModule } from '@nestjs/testing';
import { PostsController } from './posts.controller';
import { PostsService } from './posts.service';
import { SupabaseService } from '../supabase/supabase.service';

describe('PostsController', () => {
  let controller: PostsController;

  beforeEach(async () => {
    const mockPostsService = {
      findAll: jest.fn(),
      search: jest.fn(),
      create: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PostsController],
      providers: [
        {
          provide: PostsService,
          useValue: mockPostsService,
        },
        {
          provide: SupabaseService,
          useValue: {
            getClient: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<PostsController>(PostsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
