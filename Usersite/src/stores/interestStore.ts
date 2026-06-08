// Interest Management Store using React Context
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type InterestStatus = 'pending' | 'accepted' | 'rejected';

export interface Interest {
  id: string;
  fromProfileId: number;
  toProfileId: number;
  status: InterestStatus;
  message?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Favorite {
  profileId: number;
  addedAt: Date;
}

interface InterestState {
  sentInterests: Interest[];
  receivedInterests: Interest[];
  favorites: number[];
  
  // Actions
  sendInterest: (fromId: number, toId: number, message?: string) => void;
  acceptInterest: (interestId: string) => void;
  rejectInterest: (interestId: string) => void;
  toggleFavorite: (profileId: number) => void;
  isFavorite: (profileId: number) => boolean;
  getSentInterestStatus: (toProfileId: number) => InterestStatus | null;
  getReceivedInterestStatus: (fromProfileId: number) => InterestStatus | null;
  canChat: (profileId: number) => boolean;
}

// For demo purposes, we'll use profile ID 0 as the current user
const CURRENT_USER_ID = 0;

export const useInterestStore = create<InterestState>()(
  persist(
    (set, get) => ({
      sentInterests: [],
      receivedInterests: [
        // Sample received interests for demo
        {
          id: 'recv-1',
          fromProfileId: 1,
          toProfileId: CURRENT_USER_ID,
          status: 'pending',
          message: 'Hi! I found your profile very interesting. Would love to connect!',
          createdAt: new Date(Date.now() - 86400000),
          updatedAt: new Date(Date.now() - 86400000),
        },
        {
          id: 'recv-2',
          fromProfileId: 3,
          toProfileId: CURRENT_USER_ID,
          status: 'pending',
          message: 'Hello! Your hobbies match mine perfectly. Let\'s get to know each other better!',
          createdAt: new Date(Date.now() - 172800000),
          updatedAt: new Date(Date.now() - 172800000),
        },
        {
          id: 'recv-3',
          fromProfileId: 5,
          toProfileId: CURRENT_USER_ID,
          status: 'accepted',
          message: 'We seem to have a lot in common. Would you like to chat?',
          createdAt: new Date(Date.now() - 259200000),
          updatedAt: new Date(Date.now() - 86400000),
        },
      ],
      favorites: [2, 4],

      sendInterest: (fromId, toId, message) => {
        const existingInterest = get().sentInterests.find(i => i.toProfileId === toId);
        if (existingInterest) return;

        const newInterest: Interest = {
          id: `sent-${Date.now()}`,
          fromProfileId: fromId,
          toProfileId: toId,
          status: 'pending',
          message,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        set(state => ({
          sentInterests: [...state.sentInterests, newInterest],
        }));
      },

      acceptInterest: (interestId) => {
        set(state => ({
          receivedInterests: state.receivedInterests.map(i =>
            i.id === interestId ? { ...i, status: 'accepted' as InterestStatus, updatedAt: new Date() } : i
          ),
        }));
      },

      rejectInterest: (interestId) => {
        set(state => ({
          receivedInterests: state.receivedInterests.map(i =>
            i.id === interestId ? { ...i, status: 'rejected' as InterestStatus, updatedAt: new Date() } : i
          ),
        }));
      },

      toggleFavorite: (profileId) => {
        set(state => ({
          favorites: state.favorites.includes(profileId)
            ? state.favorites.filter(id => id !== profileId)
            : [...state.favorites, profileId],
        }));
      },

      isFavorite: (profileId) => {
        return get().favorites.includes(profileId);
      },

      getSentInterestStatus: (toProfileId) => {
        const interest = get().sentInterests.find(i => i.toProfileId === toProfileId);
        return interest?.status ?? null;
      },

      getReceivedInterestStatus: (fromProfileId) => {
        const interest = get().receivedInterests.find(i => i.fromProfileId === fromProfileId);
        return interest?.status ?? null;
      },

      canChat: (profileId) => {
        const sentAccepted = get().sentInterests.find(
          i => i.toProfileId === profileId && i.status === 'accepted'
        );
        const receivedAccepted = get().receivedInterests.find(
          i => i.fromProfileId === profileId && i.status === 'accepted'
        );
        return !!(sentAccepted || receivedAccepted);
      },
    }),
    {
      name: 'interest-store',
    }
  )
);
