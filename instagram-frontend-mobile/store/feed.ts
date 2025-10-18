import { create } from 'zustand';
import { Post } from '@types';

interface FeedStore {
  posts: Post[];
  setPosts: (posts: Post[]) => void;
  addPosts: (posts: Post[]) => void;
  updatePost: (postId: string, updates: Partial<Post>) => void;
  removePost: (postId: string) => void;
  clearFeed: () => void;
}

export const useFeedStore = create<FeedStore>(set => ({
  posts: [],
  setPosts: posts => set({ posts }),
  addPosts: newPosts =>
    set(state => ({
      posts: [...state.posts, ...newPosts],
    })),
  updatePost: (postId, updates) =>
    set(state => ({
      posts: state.posts.map(post => (post.id === postId ? { ...post, ...updates } : post)),
    })),
  removePost: postId =>
    set(state => ({
      posts: state.posts.filter(post => post.id !== postId),
    })),
  clearFeed: () => set({ posts: [] }),
}));

