import apiClient from '@/services/apiClient';
import type { BookedRange, Booking, Interest, Listing, ListingType, Review } from '../store/useListingsStore';

export interface ListingFilters {
  type?: ListingType;
  category?: string;
  q?: string;
}

export interface CreateListingInput {
  type: ListingType;
  title: string;
  description: string;
  category: string;
  tags?: string[];
  media?: string[];
  wantInReturn?: string;
  trialDays?: number;
  pricePerDayCents?: number;
  depositAmountCents?: number;
}

export type BadgeId = 'generous_giver' | 'mentor' | 'trusted_trader' | 'five_star';

export const BADGE_INFO: Record<BadgeId, { label: string; icon: string; description: string }> = {
  generous_giver: { label: 'Generous Giver', icon: '🎁', description: '10+ give-aways completed' },
  mentor: { label: 'Mentor', icon: '🎓', description: '5+ lessons completed' },
  trusted_trader: { label: 'Trusted Trader', icon: '🤝', description: '10+ exchanges completed' },
  five_star: { label: 'Five-Star', icon: '⭐', description: '5+ reviews averaging 4.5 or higher' },
};

export interface ReputationSummary {
  averageRating: number | null;
  totalReviews: number;
  byType: Partial<Record<ListingType, { averageRating: number; count: number }>>;
  badges: BadgeId[];
}

export interface TrendingCategory {
  category: string;
  count: number;
}

class ListingsService {
  async getListings(filters: ListingFilters = {}): Promise<Listing[]> {
    const response = await apiClient.get<Listing[]>('/listings', { params: filters });
    return response.data;
  }

  async getMyListings(): Promise<Listing[]> {
    const response = await apiClient.get<Listing[]>('/listings/mine');
    return response.data;
  }

  async getTrendingCategories(): Promise<TrendingCategory[]> {
    const response = await apiClient.get<TrendingCategory[]>('/listings/trending-categories');
    return response.data;
  }

  async getListing(id: string): Promise<Listing> {
    const response = await apiClient.get<Listing>(`/listings/${id}`);
    return response.data;
  }

  async createListing(data: CreateListingInput): Promise<Listing> {
    const response = await apiClient.post<Listing>('/listings', data);
    return response.data;
  }

  async deleteListing(id: string): Promise<void> {
    await apiClient.delete(`/listings/${id}`);
  }

  async expressInterest(listingId: string, message?: string): Promise<Interest> {
    const response = await apiClient.post<Interest>(`/listings/${listingId}/interest`, { message });
    return response.data;
  }

  async getInterests(listingId: string): Promise<Interest[]> {
    const response = await apiClient.get<Interest[]>(`/listings/${listingId}/interests`);
    return response.data;
  }

  async acceptInterest(listingId: string, interestId: string): Promise<void> {
    await apiClient.post(`/listings/${listingId}/interests/${interestId}/accept`);
  }

  async completeListing(listingId: string): Promise<{ counterpartyId: string }> {
    const response = await apiClient.post<{ counterpartyId: string }>(`/listings/${listingId}/complete`);
    return response.data;
  }

  async submitReview(input: { listingId: string; rating: number; comment?: string }): Promise<Review> {
    const response = await apiClient.post<Review>('/reviews', input);
    return response.data;
  }

  async getUserReputation(userId: string): Promise<{ summary: ReputationSummary; reviews: Review[] }> {
    const response = await apiClient.get<{ summary: ReputationSummary; reviews: Review[] }>(`/reviews/users/${userId}`);
    return response.data;
  }

  async requestBooking(listingId: string, startDate: string, endDate: string): Promise<Booking> {
    const response = await apiClient.post<Booking>(`/listings/${listingId}/bookings`, { startDate, endDate });
    return response.data;
  }

  /** Owner gets every booking; anyone else gets just the already-taken date ranges. */
  async getBookings(listingId: string): Promise<Booking[] | BookedRange[]> {
    const response = await apiClient.get<Booking[] | BookedRange[]>(`/listings/${listingId}/bookings`);
    return response.data;
  }

  /** The full detail of one booking — only visible to its renter or the listing owner. */
  async getBooking(listingId: string, bookingId: string): Promise<Booking> {
    const response = await apiClient.get<Booking>(`/listings/${listingId}/bookings/${bookingId}`);
    return response.data;
  }

  /** A non-owner's own bookings on a listing, any status — so revisiting shows where their request stands. */
  async getMyBookings(listingId: string): Promise<Booking[]> {
    const response = await apiClient.get<Booking[]>(`/listings/${listingId}/bookings`, { params: { mine: 'true' } });
    return response.data;
  }

  async acceptBooking(listingId: string, bookingId: string): Promise<void> {
    await apiClient.post(`/listings/${listingId}/bookings/${bookingId}/accept`);
  }

  async declineBooking(listingId: string, bookingId: string): Promise<void> {
    await apiClient.post(`/listings/${listingId}/bookings/${bookingId}/decline`);
  }

  async getCheckoutUrl(listingId: string, bookingId: string): Promise<string> {
    const response = await apiClient.get<{ url: string }>(`/listings/${listingId}/bookings/${bookingId}/checkout-url`);
    return response.data.url;
  }

  async completeBooking(
    listingId: string,
    bookingId: string,
    resolution: { depositAction: 'refund' | 'claim'; claimAmountCents?: number }
  ): Promise<void> {
    await apiClient.post(`/listings/${listingId}/bookings/${bookingId}/complete`, resolution);
  }

  async getConnectStatus(): Promise<{ connected: boolean; onboardingComplete: boolean }> {
    const response = await apiClient.get<{ connected: boolean; onboardingComplete: boolean }>('/payments/connect/status');
    return response.data;
  }

  async startConnectOnboarding(refreshUrl: string, returnUrl: string): Promise<string> {
    const response = await apiClient.post<{ url: string }>('/payments/connect/onboard', { refreshUrl, returnUrl });
    return response.data.url;
  }
}

export default new ListingsService();
