import { create } from 'zustand';
import { UserResponse } from '@types';

interface UserStore {
  currentUserProfile: UserResponse | null;
  visitedProfiles: Record<string, UserResponse>;
  setCurrentUserProfile: (profile: UserResponse | null) => void;
  addVisitedProfile: (profile: UserResponse) => void;
  clearVisitedProfiles: () => void;
}

export const useUserStore = create<UserStore>(set => ({
  currentUserProfile: null,
  visitedProfiles: {},
  setCurrentUserProfile: profile => set({ currentUserProfile: profile }),
  addVisitedProfile: profile =>
    set(state => ({
      visitedProfiles: {
        ...state.visitedProfiles,
        [profile.id]: profile,
      },
    })),
  clearVisitedProfiles: () => set({ visitedProfiles: {} }),
}));

