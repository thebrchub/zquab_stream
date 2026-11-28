import { publicGet } from './client';

export interface Blog {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  coverImage: string;
  author: string;
  readingTime: number;
  publishedAt: string | null;
  content?: string; 
}

// Public reads (/public/v1/blogs): the same for everyone, cached by Cloudflare.
export const blogsApi = {
  getBlogs: (limit: number = 9, offset: number = 0): Promise<Blog[]> =>
    publicGet<Blog[]>(`/blogs?limit=${limit}&offset=${offset}`),
  getBlogBySlug: (slug: string): Promise<Blog> =>
    publicGet<Blog>(`/blogs/${encodeURIComponent(slug)}`),
};