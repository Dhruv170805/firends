export interface User {
  id: string;
  username: string;
  email: string;
  avatar_url?: string | null;
  bio?: string | null;
  college_id?: string | null;
  batch_year?: number | null;
  created_at: string;
}

export interface PostMedia {
  id: string;
  post_id: string;
  media_url: string;
  media_type: 'image' | 'video';
  thumbnail_url?: string | null;
  duration?: number | null;
  created_at: string;
}

export interface Post {
  id: string;
  user_id: string;
  caption?: string | null;
  location?: string | null;
  visibility: 'public' | 'private';
  created_at: string;
  latitude?: number | null;
  longitude?: number | null;
  user?: User | null;
  media?: PostMedia[];
  likes_count: number;
  comments_count: number;
  is_liked: boolean;
  sector_id?: string | null;
}
export interface Comment {
  id: string;
  user_id: string;
  post_id: string;
  content: string;
  created_at: string;
  user?: User | null;
}
