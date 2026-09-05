import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'TrY',
  slug: 'try',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'automatic',
  assetBundlePatterns: ['**/*'],
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.try.app'
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#ffffff'
    },
    package: 'com.try.app'
  },
  web: {
    favicon: './assets/favicon.png'
  },
  plugins: [
    'expo-router',
    'expo-status-bar',
    [
      'expo-splash-screen',
      {
        image: './assets/splash.png',
        resizeMode: 'contain',
        backgroundColor: '#ffffff'
      }
    ],
    [
      'expo-notifications',
      {
        icon: './assets/notification-icon.png',
        color: '#ffffff'
      }
    ]
  ],
  scheme: 'try',
  experiments: {
    // The GitHub repo/Pages URL still uses its original "awesome-tracker-app"
    // name from before this project was renamed to TrY — renaming the repo
    // itself is a separate, deliberate decision, so the deploy path stays as
    // is for now. Other hosts (e.g. a Docker/nginx deployment serving from
    // the domain root) should build with WEB_BASE_PATH='' to disable it.
    baseUrl: process.env.WEB_BASE_PATH ?? '/awesome-tracker-app'
  },
  extra: {
    router: {
      origin: process.env.WEB_ORIGIN || 'https://KhurshidbekUrazaliev.github.io/awesome-tracker-app'
    }
  }
});
