import { ExpoConfig, ConfigContext } from 'expo/config';

// Expo SDK 55의 newArchEnabled, android.edgeToEdgeEnabled는 런타임에서는 유효하지만 타입 정의에 누락됨.
// 확장 타입으로 통과시킨다.
type WishMapExpoConfig = Omit<ExpoConfig, 'android'> & {
  newArchEnabled?: boolean;
  android?: NonNullable<ExpoConfig['android']> & { edgeToEdgeEnabled?: boolean };
};

export default ({ config }: ConfigContext): WishMapExpoConfig => ({
  ...config,
  name: '위시맵',
  slug: 'wish-map-app',
  version: '2.0.0',
  orientation: 'portrait',
  icon: './assets/images/icon.png',
  scheme: 'wishmap',
  locales: {
    ko: './languages/ko.json',
  },
  userInterfaceStyle: 'automatic',
  newArchEnabled: true,
  ios: {
    supportsTablet: false,
    bundleIdentifier: 'com.wishmap.app',
    entitlements: {
      'keychain-access-groups': ['$(AppIdentifierPrefix)com.wishmap.app'],
    },
    infoPlist: {
      CFBundleDevelopmentRegion: 'ko',
      ITSAppUsesNonExemptEncryption: false,
    },
  },
  android: {
    package: 'kr.wishmap.app',
    adaptiveIcon: {
      backgroundColor: '#E6F4FE',
      foregroundImage: './assets/images/android-icon-foreground.png',
      monochromeImage: './assets/images/android-icon-monochrome.png',
    },
    edgeToEdgeEnabled: true,
  },
  web: {
    output: 'single' as const,
    favicon: './assets/images/favicon.png',
  },
  plugins: [
    './plugins/fix-entry-file',
    './plugins/add-adi-registration',
    './plugins/disable-lint-extra-translation',
    'expo-router',
    'expo-font',
    'expo-secure-store',
    [
      'expo-splash-screen',
      {
        image: './assets/images/splash-icon.png',
        imageWidth: 200,
        resizeMode: 'contain',
        backgroundColor: '#ffffff',
        dark: {
          image: './assets/images/splash-icon-dark.png',
          backgroundColor: '#1A1A1A',
        },
      },
    ],
    'expo-notifications',
  ],
  extra: {
    eas: {
      projectId: '8fb1765b-9b9e-4dff-a01b-ceebec4dc209',
    },
  },
  experiments: {
    baseUrl: process.env.EXPO_PUBLIC_WEB_BASE_PATH || '',
    typedRoutes: true,
    reactCompiler: true,
  },
});
