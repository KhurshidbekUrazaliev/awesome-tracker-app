import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'AwesomeProject',
  slug: 'awesome-project',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'automatic',
  assetBundlePatterns: ['**/*'],
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.awesomeproject.app'
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#ffffff'
    },
    package: 'com.awesomeproject.app'
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
  scheme: 'awesomeproject',
  experiments: {
    // GitHub Pages serves this app from a /awesome-tracker-app subpath; other
    // hosts (e.g. a Docker/nginx deployment serving from the domain root)
    // should build with WEB_BASE_PATH='' to disable the prefix.
    baseUrl: process.env.WEB_BASE_PATH ?? '/awesome-tracker-app'
  },
  extra: {
    router: {
      origin: process.env.WEB_ORIGIN || 'https://KhurshidbekUrazaliev.github.io/awesome-tracker-app'
    }
  }
});
