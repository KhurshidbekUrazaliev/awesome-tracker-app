import { Ionicons } from '@expo/vector-icons';
import { Stack } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, View } from 'react-native';
import Text from '@/components/Text';
import Button from '@/components/Button';
import Loader from '@/components/Loader';
import adminService, { type AdminReport } from '@/modules/admin/services/adminService';
import { formatDate } from '@/utils/formatDate';

function isListingTarget(target: AdminReport['target']): target is { title: string; status: string } {
  return !!target && 'title' in target;
}

function ReportRow({ report, onResolve, onCloseListing }: { report: AdminReport; onResolve: () => void; onCloseListing: () => void }) {
  return (
    <View className="bg-white dark:bg-navy-900 rounded-2xl p-4 mb-3 border border-gray-100 dark:border-white/10">
      <View className="flex-row items-center justify-between mb-2">
        <View className="bg-gray-100 dark:bg-navy-800 px-2.5 py-1 rounded-full">
          <Text className="text-xs font-bold text-gray-600 dark:text-navy-300 uppercase">{report.targetType}</Text>
        </View>
        <Text className="text-xs text-gray-400 dark:text-navy-400">{formatDate(report.createdAt, 'relative')}</Text>
      </View>

      <Text className="text-sm text-gray-800 dark:text-navy-100 mb-1">{report.reason}</Text>
      <Text className="text-xs text-gray-500 dark:text-navy-300 mb-2">
        Reported by {report.reporter?.name} ({report.reporter?.email})
      </Text>

      {report.target ? (
        <View className="bg-gray-50 dark:bg-navy-800 rounded-lg px-3 py-2 mb-3">
          <Text className="text-xs font-bold text-gray-500 dark:text-navy-300 mb-0.5">TARGET</Text>
          {isListingTarget(report.target) ? (
            <Text className="text-sm text-gray-800 dark:text-navy-100">
              {report.target.title} — {report.target.status}
            </Text>
          ) : (
            <Text className="text-sm text-gray-800 dark:text-navy-100">
              {report.target.name} ({report.target.email})
            </Text>
          )}
        </View>
      ) : (
        <Text className="text-xs text-gray-400 dark:text-navy-400 mb-3">Target no longer exists.</Text>
      )}

      <View className="flex-row" style={{ gap: 8 }}>
        {!report.resolved && (
          <Button title="Mark Resolved" size="sm" onPress={onResolve} />
        )}
        {isListingTarget(report.target) && report.target.status !== 'closed' && (
          <Button title="Close Listing" size="sm" variant="danger" onPress={onCloseListing} />
        )}
        {report.resolved && (
          <Text className="text-xs font-semibold text-green-600 dark:text-green-400 self-center">Resolved</Text>
        )}
      </View>
    </View>
  );
}

export default function AdminReportsScreen() {
  const [reports, setReports] = useState<AdminReport[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      setReports(await adminService.getReports());
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load reports');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // load() sets isLoading synchronously before its first await — a
    // standard fetch-on-mount pattern, not a cascading-render risk here.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  const resolve = async (id: string) => {
    await adminService.resolveReport(id);
    setReports((prev) => prev.map((r) => (r.id === id ? { ...r, resolved: true } : r)));
  };

  const closeListing = async (report: AdminReport) => {
    await adminService.closeListing(report.targetId);
    setReports((prev) =>
      prev.map((r) => (r.id === report.id && isListingTarget(r.target) ? { ...r, target: { ...r.target, status: 'closed' } } : r))
    );
  };

  return (
    <View className="flex-1 bg-gray-50 dark:bg-navy-950">
      <Stack.Screen options={{ title: 'Reports (Admin)', headerShown: true }} />
      {isLoading && reports.length === 0 ? (
        <Loader fullScreen text="Loading reports…" />
      ) : error && reports.length === 0 ? (
        <View className="flex-1 items-center justify-center px-6">
          <Ionicons name="lock-closed-outline" size={40} color="#93A08F" />
          <Text className="text-gray-500 dark:text-navy-300 mt-3 text-center">{error}</Text>
        </View>
      ) : (
        <FlatList
          data={reports}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 24 }}
          renderItem={({ item }) => (
            <ReportRow report={item} onResolve={() => resolve(item.id)} onCloseListing={() => closeListing(item)} />
          )}
          ListEmptyComponent={
            <View className="items-center py-16">
              <Ionicons name="checkmark-done-outline" size={40} color="#93A08F" />
              <Text className="text-gray-500 dark:text-navy-300 mt-3">No reports.</Text>
            </View>
          }
        />
      )}
    </View>
  );
}
