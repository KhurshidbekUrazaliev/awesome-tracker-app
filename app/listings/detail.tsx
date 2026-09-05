import { Ionicons } from '@expo/vector-icons';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { Alert, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Avatar from '@/components/Avatar';
import Button from '@/components/Button';
import Loader from '@/components/Loader';
import PhotoGallery from '@/components/PhotoGallery';
import { useListingDetail } from '@/modules/listings/hooks/useListingDetail';
import { LISTING_TYPE_LABELS } from '@/modules/listings/store/useListingsStore';
import { useSafetyActions } from '@/modules/safety/hooks/useSafetyActions';
import { formatDate } from '@/utils/formatDate';

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
  const { listing, isOwner, interests, isLoading, error, expressInterest, acceptInterest, complete, submitReview } =
    useListingDetail(id);

  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [reviewSent, setReviewSent] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const { report, blockUser } = useSafetyActions();
  const [showReportInput, setShowReportInput] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportSent, setReportSent] = useState(false);

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

        <Text className="text-2xl font-extrabold text-gray-900 dark:text-white mb-2">{listing.title}</Text>
        <Text className="text-base text-gray-700 dark:text-navy-200 leading-relaxed mb-4">{listing.description}</Text>

        {listing.wantInReturn && (
          <View className="bg-gray-50 dark:bg-navy-900 rounded-xl p-4 mb-4">
            <Text className="text-xs font-bold text-gray-500 dark:text-navy-300 mb-1">WANTS IN RETURN</Text>
            <Text className="text-sm text-gray-800 dark:text-navy-100">{listing.wantInReturn}</Text>
          </View>
        )}

        {listing.trialDays != null && (
          <View className="bg-gray-50 dark:bg-navy-900 rounded-xl p-4 mb-4 flex-row items-center">
            <Ionicons name="time-outline" size={18} color="#7c3aed" />
            <Text className="text-sm text-gray-800 dark:text-navy-100 ml-2">
              Try it for up to {listing.trialDays} {listing.trialDays === 1 ? 'day' : 'days'}
            </Text>
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
                <Ionicons name="flag-outline" size={20} color="#9CA3AF" />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleBlock} accessibilityLabel="Block this person">
                <Ionicons name="ban-outline" size={20} color="#9CA3AF" />
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
              placeholderTextColor="#9CA3AF"
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
        {!isOwner && listing.status === 'open' && (
          <View>
            <Text className="text-sm font-medium text-gray-700 dark:text-navy-200 mb-2">
              {listing.type === 'exchange' ? 'Propose what you can offer' : 'Say a little about yourself (optional)'}
            </Text>
            <TextInput
              value={message}
              onChangeText={setMessage}
              placeholder={listing.type === 'exchange' ? "What you'd trade for this" : 'Optional message'}
              placeholderTextColor="#9CA3AF"
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

        {/* Owner: manage interests */}
        {isOwner && listing.status === 'open' && (
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
              placeholderTextColor="#9CA3AF"
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
