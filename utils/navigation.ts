import { router } from 'expo-router';

export const navigation = {
  navigate: (path: string) => {
    router.push(path as any);
  },

  replace: (path: string) => {
    router.replace(path as any);
  },

  back: () => {
    router.back();
  },

  canGoBack: () => {
    return router.canGoBack();
  },
};

export function buildPath(base: string, params?: Record<string, string | number>): string {
  if (!params) return base;

  const queryString = Object.entries(params)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join('&');

  return `${base}?${queryString}`;
}
