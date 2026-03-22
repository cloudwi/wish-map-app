import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: '위시맵',
  slug: 'wish-map-app',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/images/icon.png',
  scheme: 'wishmap',
  userInterfaceStyle: 'automatic',
  newArchEnabled: true,
  ios: {
    supportsTablet: false,
    bundleIdentifier: 'com.wishmap.app',
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false,
      LSApplicationQueriesSchemes: [
        'kakaokompassauth',
        'naversearchapp',
        'naversearchthirdlogin',
        'nmap',
      ],
      CFBundleURLTypes: [
        {
          CFBundleURLSchemes: [
            `com.googleusercontent.apps.${(process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || '').split('.')[0]}`,
          ],
        },
      ],
    },
  },
  android: {
    package: 'com.wishmap.app',
    adaptiveIcon: {
      backgroundColor: '#E6F4FE',
      foregroundImage: './assets/images/android-icon-foreground.png',
      backgroundImage: './assets/images/android-icon-background.png',
      monochromeImage: './assets/images/android-icon-monochrome.png',
    },
    edgeToEdgeEnabled: true,
  },
  web: {
    output: 'static' as const,
    favicon: './assets/images/favicon.png',
  },
  plugins: [
    'expo-router',
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
    [
      '@react-native-seoul/kakao-login',
      {
        kakaoAppKey: process.env.KAKAO_APP_KEY,
        kotlinVersion: '2.1.0',
      },
    ],
    '@react-native-google-signin/google-signin',
    [
      '@react-native-seoul/naver-login',
      {
        consumerKey: process.env.EXPO_PUBLIC_NAVER_CONSUMER_KEY,
        consumerSecret: process.env.EXPO_PUBLIC_NAVER_CONSUMER_SECRET,
        appName: '위시맵',
        urlScheme: 'wishmap',
      },
    ],
    'expo-apple-authentication',
    [
      '@mj-studio/react-native-naver-map',
      {
        client_id: process.env.EXPO_PUBLIC_NAVER_MAP_CLIENT_ID,
      },
    ],
  ],
  extra: {
    eas: {
      projectId: '8fb1765b-9b9e-4dff-a01b-ceebec4dc209',
    },
  },
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
});
