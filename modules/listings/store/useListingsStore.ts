import { create } from 'zustand';
import type { User as PublicUser } from '@/store/useUserStore';

export const LISTING_TYPES = ['idea', 'lesson', 'give_away', 'exchange', 'trial'] as const;
export type ListingType = (typeof LISTING_TYPES)[number];

export const LISTING_TYPE_LABELS: Record<ListingType, string> = {
  idea: 'Idea',
  lesson: 'Lesson',
  give_away: 'Give away',
  exchange: 'Exchange',
  trial: 'Trial',
};

export interface Listing {
  id: string;
  ownerId: string;
  owner?: PublicUser;
  type: ListingType;
  title: string;
  description: string;
  category: string;
  tags: string[];
  media: string[];
  wantInReturn?: string;
  trialDays?: number;
  status: 'open' | 'pending' | 'completed' | 'closed';
  createdAt: string;
  updatedAt: string;
}

export interface Interest {
  id: string;
  listingId: string;
  requesterId: string;
  requester?: PublicUser;
  message?: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: string;
}

export interface Review {
  id: string;
  listingId: string;
  reviewerId: string;
  reviewer?: PublicUser;
  revieweeId: string;
  rating: number;
  comment?: string;
  createdAt: string;
}

interface ListingsStore {
  listings: Listing[];
  interestsByListing: Record<string, Interest[]>;
  setListings: (listings: Listing[]) => void;
  upsertListing: (listing: Listing) => void;
  removeListing: (id: string) => void;
  setInterests: (listingId: string, interests: Interest[]) => void;
  addInterest: (interest: Interest) => void;
  updateInterestStatus: (listingId: string, interestId: string, status: Interest['status']) => void;
}

export const useListingsStore = create<ListingsStore>((set) => ({
  listings: [],
  interestsByListing: {},

  setListings: (listings) => set({ listings }),

  upsertListing: (listing) =>
    set((state) => {
      const exists = state.listings.some((l) => l.id === listing.id);
      return {
        listings: exists
          ? state.listings.map((l) => (l.id === listing.id ? listing : l))
          : [listing, ...state.listings],
      };
    }),

  removeListing: (id) =>
    set((state) => ({ listings: state.listings.filter((l) => l.id !== id) })),

  setInterests: (listingId, interests) =>
    set((state) => ({ interestsByListing: { ...state.interestsByListing, [listingId]: interests } })),

  addInterest: (interest) =>
    set((state) => ({
      interestsByListing: {
        ...state.interestsByListing,
        [interest.listingId]: [interest, ...(state.interestsByListing[interest.listingId] || [])],
      },
    })),

  updateInterestStatus: (listingId, interestId, status) =>
    set((state) => ({
      interestsByListing: {
        ...state.interestsByListing,
        [listingId]: (state.interestsByListing[listingId] || []).map((i) =>
          i.id === interestId ? { ...i, status } : i
        ),
      },
    })),
}));
