import { Ionicons } from '@expo/vector-icons';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { Alert, ScrollView, TextInput, TouchableOpacity, View } from 'react-native';
import Text from '@/components/Text';
import Avatar from '@/components/Avatar';
import Button from '@/components/Button';
import Loader from '@/components/Loader';
import PhotoGallery from '@/components/PhotoGallery';
import RentalAvailabilityCalendar from '@/components/RentalAvailabilityCalendar';
import { useAuctionBids } from '@/modules/listings/hooks/useAuctionBids';
import { useListingDetail } from '@/modules/listings/hooks/useListingDetail';
import { useRentalBookings } from '@/modules/listings/hooks/useRentalBookings';
import { LISTING_TYPE_LABELS, type Booking } from '@/modules/listings/store/useListingsStore';
import { useSafetyActions } from '@/modules/safety/hooks/useSafetyActions';
import { formatDate } from '@/utils/formatDate';

function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

const BOOKING_STATUS_LABELS: Record<Booking['status'], string> = {
  requested: 'Requested — waiting for owner',
  accepted: 'Accepted — payment needed',
  confirmed: 'Confirmed',
  declined: 'Declined',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

const STATUS_STYLES: Record<string, string> = {
  open: 'bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-300',
  pending: 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300',
  completed: 'bg-gray-100 dark:bg-navy-700 text-gray-600 dark:text-navy-200',
  closed: 'bg-gray-100 dark:bg-navy-700 text-gray-500 dark:text-navy-300',
};

function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <View className="flex-row" style={{ gap: 6 }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <TouchableOpacity key={n} onPress={() => onChange(n)}>
          <Ionicons name={n <= value ? 'star' : 'star-outline'} size={28} color="#f59e0b" />
        </TouchableOpacity>
      ))}
    </View>
  );
}

export default function ListingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const {
    listing,
    isOwner,
    isCurrentBidder,
    interests,
    isLoading,
    error,
    expressInterest,
    acceptInterest,
    complete,
    submitReview,
    refresh,
  } = useListingDetail(id);
  const isRental = listing?.type === 'rental';
  const isAuction = listing?.type === 'auction';
  const isPhysicalListing = !!listing && ['give_away', 'exchange', 'trial', 'rental', 'auction'].includes(listing.type);
  // Mirrors the server's checkTransactionDistance (routes/listings.ts): null distanceKm on a
  // physical listing means the viewer hasn't set their own location, not that it's nearby.
  const locationBlockMessage =
    listing && isPhysicalListing
      ? listing.distanceKm == null
        ? 'Set your location in Settings before requesting, booking, or bidding on physical items.'
        : listing.distanceKm > (listing.maxTransactionDistanceKm ?? 75)
        ? `This listing is ${listing.distanceKm.toLocaleString()} km away — too far for in-person pickup (max ${listing.maxTransactionDistanceKm ?? 75} km).`
        : null
      : null;
  const {
    bookings,
    bookedRanges,
    myBookings,
    requestBooking,
    acceptBooking,
    declineBooking,
    payForBooking,
    completeBooking,
  } = useRentalBookings(id, isOwner, !!isRental);
  const { bids, placeBid, payForAuction } = useAuctionBids(id, isOwner, !!isAuction);

  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [reviewSent, setReviewSent] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [bidAmount, setBidAmount] = useState('');
  const [isBidding, setIsBidding] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const { report, blockUser } = useSafetyActions();
  const [showReportInput, setShowReportInput] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportSent, setReportSent] = useState(false);

  const [selectedRange, setSelectedRange] = useState<{ startDate: string; endDate: string } | null>(null);
  const [isBooking, setIsBooking] = useState(false);
  const [claimInputFor, setClaimInputFor] = useState<string | null>(null);
  const [claimAmount, setClaimAmount] = useState('');

  if (isLoading && !listing) return <Loader fullScreen text="Loading…" />;
  if (error || !listing) {
    return (
      <View className="flex-1 items-center justify-center bg-white dark:bg-navy-950 px-6">
        <Stack.Screen options={{ title: 'Listing', headerShown: true }} />
        <Text className="text-gray-500 dark:text-navy-300">{error || 'Listing not found'}</Text>
      </View>
    );
  }

  const acceptedInterest = interests.find((i) => i.status === 'accepted');

  const handleExpressInterest = async () => {
    try {
      setSending(true);
      setActionError(null);
      await expressInterest(message.trim() || undefined);
      setMessage('');
    } catch (err: any) {
      setActionError(err.response?.data?.message || 'Failed to send');
    } finally {
      setSending(false);
    }
  };

  const handleAccept = async (interestId: string) => {
    try {
      setActionError(null);
      await acceptInterest(interestId);
    } catch (err: any) {
      setActionError(err.response?.data?.message || 'Failed to accept');
    }
  };

  const handleComplete = async () => {
    try {
      setActionError(null);
      await complete();
    } catch (err: any) {
      setActionError(err.response?.data?.message || 'Failed to complete');
    }
  };

  const handleRequestBooking = async () => {
    if (!selectedRange) return;
    try {
      setIsBooking(true);
      setActionError(null);
      await requestBooking(selectedRange.startDate, selectedRange.endDate);
      setSelectedRange(null);
    } catch (err: any) {
      setActionError(err.response?.data?.message || 'Failed to request booking');
    } finally {
      setIsBooking(false);
    }
  };

  const handleAcceptBooking = async (bookingId: string) => {
    try {
      setActionError(null);
      await acceptBooking(bookingId);
    } catch (err: any) {
      setActionError(err.response?.data?.message || 'Failed to accept booking');
    }
  };

  const handleDeclineBooking = async (bookingId: string) => {
    try {
      setActionError(null);
      await declineBooking(bookingId);
    } catch (err: any) {
      setActionError(err.response?.data?.message || 'Failed to decline booking');
    }
  };

  const handlePayForBooking = async (bookingId: string) => {
    try {
      setActionError(null);
      await payForBooking(bookingId);
    } catch (err: any) {
      setActionError(err.response?.data?.message || 'Failed to start payment');
    }
  };

  const handleCompleteBooking = async (booking: Booking, depositAction: 'refund' | 'claim') => {
    const claimCents = depositAction === 'claim' ? Math.round(parseFloat(claimAmount || '0') * 100) : undefined;
    if (depositAction === 'claim' && (!claimCents || claimCents > booking.depositAmountCents)) {
      setActionError("Enter a valid claim amount, up to the deposit.");
      return;
    }
    try {
      setActionError(null);
      await completeBooking(booking.id, { depositAction, claimAmountCents: claimCents });
      setClaimInputFor(null);
      setClaimAmount('');
    } catch (err: any) {
      setActionError(err.response?.data?.message || 'Failed to complete booking');
    }
  };

  const handlePlaceBid = async () => {
    const amountCents = Math.round(parseFloat(bidAmount || '0') * 100);
    if (!amountCents || amountCents <= (listing.currentBidCents ?? 0)) {
      setActionError('Enter a bid higher than the current one.');
      return;
    }
    try {
      setIsBidding(true);
      setActionError(null);
      await placeBid(amountCents);
      setBidAmount('');
      await refresh();
    } catch (err: any) {
      setActionError(err.response?.data?.message || 'Failed to place bid');
    } finally {
      setIsBidding(false);
    }
  };

  const handlePayForAuction = async () => {
    try {
      setIsPaying(true);
      setActionError(null);
      await payForAuction();
    } catch (err: any) {
      setActionError(err.response?.data?.message || 'Failed to start payment');
      setIsPaying(false);
    }
  };

  const handleReview = async () => {
    if (rating === 0) return;
    try {
      setActionError(null);
      await submitReview(rating, comment.trim() || undefined);
      setReviewSent(true);
    } catch (err: any) {
      setActionError(err.response?.data?.message || 'Failed to submit review');
    }
  };

  const handleSubmitReport = async () => {
    if (!reportReason.trim()) return;
    try {
      setActionError(null);
      await report('listing', listing.id, reportReason.trim());
      setReportSent(true);
      setShowReportInput(false);
    } catch (err: any) {
      setActionError(err.response?.data?.message || 'Failed to submit report');
    }
  };

  const handleBlock = () => {
    Alert.alert(
      `Block ${listing.owner?.name}?`,
      "You won't see their listings anymore, and they won't see yours.",
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Block',
          style: 'destructive',
          onPress: async () => {
            try {
              await blockUser(listing.ownerId);
              router.back();
            } catch (err: any) {
              setActionError(err.response?.data?.message || 'Failed to block user');
            }
          },
        },
      ]
    );
  };

  return (
    <View className="flex-1 bg-white dark:bg-navy-950">
      <Stack.Screen options={{ title: LISTING_TYPE_LABELS[listing.type], headerShown: true }} />
      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 48 }}>
        {listing.media.length > 0 && (
          <View className="mb-4">
            <PhotoGallery photos={listing.media} height={220} />
          </View>
        )}

        <View className="flex-row items-center justify-between mb-3">
          <View className="bg-primary-100 dark:bg-primary-500/20 px-3 py-1 rounded-full">
            <Text className="text-xs font-bold text-primary-700 dark:text-primary-300">
              {LISTING_TYPE_LABELS[listing.type]}
            </Text>
          </View>
          <View className={`px-3 py-1 rounded-full ${STATUS_STYLES[listing.status]}`}>
            <Text className="text-xs font-bold capitalize">{listing.status}</Text>
          </View>
        </View>

        <Text className="font-display text-2xl font-semibold text-gray-900 dark:text-white mb-2">{listing.title}</Text>
        <Text className="text-base text-gray-700 dark:text-navy-200 leading-relaxed mb-4">{listing.description}</Text>

        {listing.wantInReturn && (
          <View className="bg-gray-50 dark:bg-navy-900 rounded-xl p-4 mb-4">
            <Text className="text-xs font-bold text-gray-500 dark:text-navy-300 mb-1">WANTS IN RETURN</Text>
            <Text className="text-sm text-gray-800 dark:text-navy-100">{listing.wantInReturn}</Text>
          </View>
        )}

        {listing.trialDays != null && (
          <View className="bg-gray-50 dark:bg-navy-900 rounded-xl p-4 mb-4 flex-row items-center">
            <Ionicons name="time-outline" size={18} color="#b8660f" />
            <Text className="text-sm text-gray-800 dark:text-navy-100 ml-2">
              Try it for up to {listing.trialDays} {listing.trialDays === 1 ? 'day' : 'days'}
            </Text>
          </View>
        )}

        {isRental && listing.pricePerDayCents != null && (
          <View className="bg-gray-50 dark:bg-navy-900 rounded-xl p-4 mb-4 flex-row items-center justify-between">
            <View>
              <Text className="text-lg font-bold text-gray-900 dark:text-white">{formatCents(listing.pricePerDayCents)}/day</Text>
              {!!listing.depositAmountCents && (
                <Text className="text-xs text-gray-500 dark:text-navy-300 mt-0.5">
                  + {formatCents(listing.depositAmountCents)} refundable deposit
                </Text>
              )}
            </View>
            <Ionicons name="pricetag-outline" size={20} color="#b8660f" />
          </View>
        )}

        {isAuction && (
          <View className="bg-gray-50 dark:bg-navy-900 rounded-xl p-4 mb-4 flex-row items-center justify-between">
            <View>
              <Text className="text-lg font-bold text-gray-900 dark:text-white">
                {formatCents(listing.currentBidCents ?? listing.startingBidCents ?? 0)}
              </Text>
              <Text className="text-xs text-gray-500 dark:text-navy-300 mt-0.5">
                {listing.currentBidCents != null ? 'Current bid' : 'Starting bid'}
                {listing.status === 'open' && listing.auctionEndsAt && ` · Ends ${formatDate(listing.auctionEndsAt, 'relative')}`}
              </Text>
            </View>
            <Ionicons name="hammer-outline" size={20} color="#b8660f" />
          </View>
        )}

        <View className="flex-row items-center flex-wrap mb-5" style={{ gap: 6 }}>
          <View className="bg-gray-100 dark:bg-navy-800 px-2.5 py-1 rounded-full">
            <Text className="text-xs text-gray-600 dark:text-navy-300">{listing.category}</Text>
          </View>
          {listing.tags.map((tag) => (
            <View key={tag} className="bg-gray-100 dark:bg-navy-800 px-2.5 py-1 rounded-full">
              <Text className="text-xs text-gray-600 dark:text-navy-300">#{tag}</Text>
            </View>
          ))}
          {(listing.location?.city || listing.location?.country) && (
            <View className="bg-gray-100 dark:bg-navy-800 px-2.5 py-1 rounded-full flex-row items-center">
              <Ionicons name="location-outline" size={12} color="#6B7280" />
              <Text className="text-xs text-gray-600 dark:text-navy-300 ml-1">
                {[listing.location.city, listing.location.country].filter(Boolean).join(', ')}
                {listing.distanceKm != null && ` · ${listing.distanceKm.toLocaleString()} km away`}
              </Text>
            </View>
          )}
        </View>

        <View className="flex-row items-center justify-between mb-3 pb-6 border-b border-gray-100 dark:border-white/10">
          <View className="flex-row items-center">
            <Avatar uri={listing.owner?.avatar} name={listing.owner?.name} size="md" />
            <View className="ml-3">
              <Text className="text-sm font-semibold text-gray-900 dark:text-white">{listing.owner?.name}</Text>
              <Text className="text-xs text-gray-400 dark:text-navy-400">
                Posted {formatDate(listing.createdAt, 'relative')}
              </Text>
            </View>
          </View>
          {!isOwner && (
            <View className="flex-row" style={{ gap: 16 }}>
              <TouchableOpacity onPress={() => setShowReportInput((v) => !v)} accessibilityLabel="Report this listing">
                <Ionicons name="flag-outline" size={20} color="#93A08F" />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleBlock} accessibilityLabel="Block this person">
                <Ionicons name="ban-outline" size={20} color="#93A08F" />
              </TouchableOpacity>
            </View>
          )}
        </View>

        {showReportInput && !reportSent && (
          <View className="bg-gray-50 dark:bg-navy-900 rounded-xl p-4 mb-4">
            <Text className="text-sm font-medium text-gray-700 dark:text-navy-200 mb-2">Why are you reporting this?</Text>
            <TextInput
              value={reportReason}
              onChangeText={setReportReason}
              placeholder="Tell us what's wrong"
              placeholderTextColor="#93A08F"
              multiline
              className="border border-gray-300 dark:border-navy-600 rounded-lg px-3 py-3 text-gray-900 dark:text-white mb-3"
              style={{ minHeight: 56, textAlignVertical: 'top' }}
            />
            <Button title="Submit Report" size="sm" onPress={handleSubmitReport} disabled={!reportReason.trim()} />
          </View>
        )}
        {reportSent && (
          <Text className="text-sm text-green-600 dark:text-green-400 mb-4">
            Thanks — we&apos;ve received your report.
          </Text>
        )}

        {actionError && <Text className="text-sm text-red-500 mb-4">{actionError}</Text>}

        {/* Non-owner: express interest / propose a trade */}
        {!isRental && !isAuction && !isOwner && listing.status === 'open' && !locationBlockMessage && (
          <View>
            <Text className="text-sm font-medium text-gray-700 dark:text-navy-200 mb-2">
              {listing.type === 'exchange' ? 'Propose what you can offer' : 'Say a little about yourself (optional)'}
            </Text>
            <TextInput
              value={message}
              onChangeText={setMessage}
              placeholder={listing.type === 'exchange' ? "What you'd trade for this" : 'Optional message'}
              placeholderTextColor="#93A08F"
              multiline
              className="border border-gray-300 dark:border-navy-600 rounded-lg px-3 py-3 text-gray-900 dark:text-white mb-3"
              style={{ minHeight: 64, textAlignVertical: 'top' }}
            />
            <Button
              title={listing.type === 'exchange' ? 'Propose Trade' : listing.type === 'trial' ? 'Ask to Try' : 'Express Interest'}
              onPress={handleExpressInterest}
              loading={sending}
              fullWidth
            />
          </View>
        )}

        {/* Non-owner, physical listing: too far away or no location set */}
        {!isRental && !isAuction && !isOwner && listing.status === 'open' && locationBlockMessage && (
          <View className="bg-gray-50 dark:bg-navy-900 rounded-xl p-4">
            <Text className="text-sm text-gray-600 dark:text-navy-300">{locationBlockMessage}</Text>
          </View>
        )}

        {/* Owner: manage interests */}
        {!isRental && !isAuction && isOwner && listing.status === 'open' && (
          <View>
            <Text className="text-base font-bold text-gray-900 dark:text-white mb-3">
              Interested people ({interests.length})
            </Text>
            {interests.length === 0 && (
              <Text className="text-sm text-gray-500 dark:text-navy-300">No one yet — share this listing to get responses.</Text>
            )}
            {interests.map((interest) => (
              <View key={interest.id} className="bg-gray-50 dark:bg-navy-900 rounded-xl p-4 mb-3">
                <View className="flex-row items-center mb-2">
                  <Avatar uri={interest.requester?.avatar} name={interest.requester?.name} size="sm" />
                  <Text className="text-sm font-semibold text-gray-900 dark:text-white ml-2">
                    {interest.requester?.name}
                  </Text>
                </View>
                {interest.message && (
                  <Text className="text-sm text-gray-700 dark:text-navy-200 mb-3">{interest.message}</Text>
                )}
                {interest.status === 'pending' ? (
                  <Button title="Accept" size="sm" onPress={() => handleAccept(interest.id)} />
                ) : (
                  <Text className="text-xs font-bold text-primary-600 dark:text-primary-400 uppercase">
                    {interest.status}
                  </Text>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Non-owner: pick dates and request a rental booking, or see the status of an existing request */}
        {isRental && !isOwner && listing.status === 'open' && (() => {
          const myActiveBooking = myBookings.find((b) => ['requested', 'accepted', 'confirmed'].includes(b.status));
          if (myActiveBooking) {
            return (
              <View className="bg-gray-50 dark:bg-navy-900 rounded-xl p-4">
                <Text className="text-base font-bold text-gray-900 dark:text-white mb-1">
                  {myActiveBooking.startDate} → {myActiveBooking.endDate}
                </Text>
                <Text className="text-sm text-gray-600 dark:text-navy-300 mb-3">{BOOKING_STATUS_LABELS[myActiveBooking.status]}</Text>
                {myActiveBooking.status === 'accepted' && (
                  <Button title="Pay Now" onPress={() => handlePayForBooking(myActiveBooking.id)} fullWidth />
                )}
              </View>
            );
          }
          if (locationBlockMessage) {
            return (
              <View className="bg-gray-50 dark:bg-navy-900 rounded-xl p-4">
                <Text className="text-sm text-gray-600 dark:text-navy-300">{locationBlockMessage}</Text>
              </View>
            );
          }
          return (
            <View>
              <Text className="text-base font-bold text-gray-900 dark:text-white mb-3">Pick your dates</Text>
              <RentalAvailabilityCalendar bookedRanges={bookedRanges} value={selectedRange} onChange={setSelectedRange} />
              <View className="mt-4">
                <Button title="Request to Book" onPress={handleRequestBooking} loading={isBooking} disabled={!selectedRange} fullWidth />
              </View>
            </View>
          );
        })()}

        {/* Owner: manage booking requests */}
        {isRental && isOwner && (
          <View>
            <Text className="text-base font-bold text-gray-900 dark:text-white mb-3">Bookings ({bookings.length})</Text>
            {bookings.length === 0 && (
              <Text className="text-sm text-gray-500 dark:text-navy-300">No requests yet — share this listing to get bookings.</Text>
            )}
            {bookings.map((booking) => (
              <View key={booking.id} className="bg-gray-50 dark:bg-navy-900 rounded-xl p-4 mb-3">
                <View className="flex-row items-center mb-2">
                  <Avatar uri={booking.renter?.avatar} name={booking.renter?.name} size="sm" />
                  <Text className="text-sm font-semibold text-gray-900 dark:text-white ml-2">{booking.renter?.name}</Text>
                </View>
                <Text className="text-sm text-gray-700 dark:text-navy-200 mb-1">
                  {booking.startDate} → {booking.endDate} · {formatCents(booking.rentalFeeCents)}
                  {!!booking.depositAmountCents && ` + ${formatCents(booking.depositAmountCents)} deposit`}
                </Text>

                {booking.status === 'requested' && (
                  <View className="flex-row mt-2" style={{ gap: 8 }}>
                    <Button title="Accept" size="sm" onPress={() => handleAcceptBooking(booking.id)} />
                    <Button title="Decline" size="sm" variant="outline" onPress={() => handleDeclineBooking(booking.id)} />
                  </View>
                )}

                {booking.status === 'confirmed' && claimInputFor !== booking.id && (
                  <View className="flex-row mt-2" style={{ gap: 8 }}>
                    <Button title="Return was fine" size="sm" onPress={() => handleCompleteBooking(booking, 'refund')} />
                    {booking.depositAmountCents > 0 && (
                      <Button title="Keep deposit" size="sm" variant="outline" onPress={() => setClaimInputFor(booking.id)} />
                    )}
                  </View>
                )}

                {booking.status === 'confirmed' && claimInputFor === booking.id && (
                  <View className="mt-2">
                    <Text className="text-xs text-gray-500 dark:text-navy-300 mb-1">
                      How much of the {formatCents(booking.depositAmountCents)} deposit?
                    </Text>
                    <View className="flex-row items-center" style={{ gap: 8 }}>
                      <TextInput
                        value={claimAmount}
                        onChangeText={(v) => setClaimAmount(v.replace(/[^0-9.]/g, ''))}
                        placeholder="0.00"
                        keyboardType="decimal-pad"
                        placeholderTextColor="#93A08F"
                        className="flex-1 border border-gray-300 dark:border-navy-600 rounded-lg px-3 py-2 text-gray-900 dark:text-white"
                      />
                      <Button title="Confirm" size="sm" onPress={() => handleCompleteBooking(booking, 'claim')} />
                    </View>
                  </View>
                )}

                {!['requested', 'confirmed'].includes(booking.status) && (
                  <Text className="text-xs font-bold text-primary-600 dark:text-primary-400 uppercase mt-1">
                    {booking.status}
                  </Text>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Non-owner: place a bid */}
        {isAuction && !isOwner && listing.status === 'open' && !locationBlockMessage && (
          <View>
            <Text className="text-sm font-medium text-gray-700 dark:text-navy-200 mb-2">Your bid</Text>
            <View className="flex-row items-center" style={{ gap: 8 }}>
              <TextInput
                value={bidAmount}
                onChangeText={(v) => setBidAmount(v.replace(/[^0-9.]/g, ''))}
                placeholder={`More than ${formatCents(listing.currentBidCents ?? listing.startingBidCents ?? 0)}`}
                placeholderTextColor="#93A08F"
                keyboardType="decimal-pad"
                className="flex-1 border border-gray-300 dark:border-navy-600 rounded-lg px-3 py-3 text-gray-900 dark:text-white"
              />
              <Button title="Place Bid" onPress={handlePlaceBid} loading={isBidding} disabled={!bidAmount} />
            </View>
          </View>
        )}

        {/* Non-owner, auction: too far away or no location set */}
        {isAuction && !isOwner && listing.status === 'open' && locationBlockMessage && (
          <View className="bg-gray-50 dark:bg-navy-900 rounded-xl p-4">
            <Text className="text-sm text-gray-600 dark:text-navy-300">{locationBlockMessage}</Text>
          </View>
        )}

        {/* Owner: read-only bid history */}
        {isAuction && isOwner && listing.status === 'open' && (
          <View>
            <Text className="text-base font-bold text-gray-900 dark:text-white mb-3">Bids ({bids.length})</Text>
            {bids.length === 0 && (
              <Text className="text-sm text-gray-500 dark:text-navy-300">No bids yet — share this listing to get some.</Text>
            )}
            {bids.map((bid) => (
              <View key={bid.id} className="bg-gray-50 dark:bg-navy-900 rounded-xl p-4 mb-2 flex-row items-center justify-between">
                <View className="flex-row items-center">
                  <Avatar uri={bid.bidder?.avatar} name={bid.bidder?.name} size="sm" />
                  <Text className="text-sm font-semibold text-gray-900 dark:text-white ml-2">{bid.bidder?.name}</Text>
                </View>
                <Text className="text-sm font-bold text-gray-900 dark:text-white">{formatCents(bid.amountCents)}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Winning bidder: pay for the auction */}
        {isAuction && isCurrentBidder && listing.status === 'pending' && !listing.auctionPaymentComplete && (
          <View className="bg-gray-50 dark:bg-navy-900 rounded-xl p-4">
            <Text className="text-base font-bold text-gray-900 dark:text-white mb-1">You won this auction!</Text>
            <Text className="text-sm text-gray-600 dark:text-navy-300 mb-3">
              Pay {formatCents(listing.currentBidCents ?? 0)} to claim it.
            </Text>
            <Button title="Pay Now" onPress={handlePayForAuction} loading={isPaying} fullWidth />
          </View>
        )}

        {/* Winning bidder, already paid: waiting on the owner to hand it off */}
        {isAuction && isCurrentBidder && listing.status === 'pending' && listing.auctionPaymentComplete && (
          <Text className="text-sm text-gray-600 dark:text-navy-300">
            Paid — waiting for the owner to mark this completed.
          </Text>
        )}

        {/* Everyone else once the auction has closed without them winning */}
        {isAuction && !isOwner && !isCurrentBidder && (listing.status === 'pending' || listing.status === 'closed') && (
          <Text className="text-sm text-gray-500 dark:text-navy-300">
            {listing.status === 'closed' ? 'This auction closed with no bids.' : 'This auction has ended.'}
          </Text>
        )}

        {isOwner && listing.status === 'pending' && acceptedInterest && (
          <View>
            <Text className="text-sm text-gray-600 dark:text-navy-300 mb-3">
              You accepted {acceptedInterest.requester?.name}. Once you've handed it off, mark this complete.
            </Text>
            <Button title="Mark Completed" onPress={handleComplete} fullWidth />
          </View>
        )}

        {listing.status === 'completed' && !reviewSent && (
          <View className="bg-gray-50 dark:bg-navy-900 rounded-xl p-4">
            <Text className="text-base font-bold text-gray-900 dark:text-white mb-3">Leave a review</Text>
            <StarPicker value={rating} onChange={setRating} />
            <TextInput
              value={comment}
              onChangeText={setComment}
              placeholder="How did it go? (optional)"
              placeholderTextColor="#93A08F"
              multiline
              className="border border-gray-300 dark:border-navy-600 rounded-lg px-3 py-3 text-gray-900 dark:text-white my-3"
              style={{ minHeight: 64, textAlignVertical: 'top' }}
            />
            <Button title="Submit Review" onPress={handleReview} disabled={rating === 0} />
          </View>
        )}

        {listing.status === 'completed' && reviewSent && (
          <Text className="text-sm text-green-600 dark:text-green-400 font-medium">Thanks for your review!</Text>
        )}
      </ScrollView>
    </View>
  );
}
