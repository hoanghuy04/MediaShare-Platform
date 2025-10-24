import { create } from 'zustand';
import { UserProfile } from '@types';

interface UserStore {
  currentUserProfile: UserProfile | null;
  visitedProfiles: Record<string, UserProfile>;
  setCurrentUserProfile: (profile: UserProfile | null) => void;
  addVisitedProfile: (profile: UserProfile) => void;
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

