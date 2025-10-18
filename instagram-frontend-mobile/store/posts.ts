import { create } from 'zustand';
import { Post } from '@types';

interface PostsStore {
  cachedPosts: Record<string, Post>;
  cachePost: (post: Post) => void;
  getCachedPost: (postId: string) => Post | undefined;
  updateCachedPost: (postId: string, updates: Partial<Post>) => void;
  removeCachedPost: (postId: string) => void;
  clearCache: () => void;
}

export const usePostsStore = create<PostsStore>((set, get) => ({
  cachedPosts: {},
  cachePost: post =>
    set(state => ({
      cachedPosts: {
        ...state.cachedPosts,
        [post.id]: post,
      },
    })),
  getCachedPost: postId => get().cachedPosts[postId],
  updateCachedPost: (postId, updates) =>
    set(state => ({
      cachedPosts: {
        ...state.cachedPosts,
        [postId]: state.cachedPosts[postId]
          ? { ...state.cachedPosts[postId], ...updates }
          : (updates as Post),
      },
    })),
  removeCachedPost: postId =>
    set(state => {
      const newCache = { ...state.cachedPosts };
      delete newCache[postId];
      return { cachedPosts: newCache };
    }),
  clearCache: () => set({ cachedPosts: {} }),
}));

