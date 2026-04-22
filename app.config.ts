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
  version: '1.1.5',
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
      NSLocationWhenInUseUsageDescription:
        '위시맵은 주변 장소를 지도에 표시하고, 방문 인증 시 가게와의 거리(100m 이내)를 확인하기 위해 위치 정보를 사용합니다.',
      NSLocationAlwaysAndWhenInUseUsageDescription:
        '위시맵은 주변 장소를 지도에 표시하고, 방문 인증 시 가게와의 거리(100m 이내)를 확인하기 위해 위치 정보를 사용합니다.',
      NSLocationAlwaysUsageDescription:
        '위시맵은 주변 장소를 지도에 표시하고, 방문 인증 시 가게와의 거리(100m 이내)를 확인하기 위해 위치 정보를 사용합니다.',
      NSCameraUsageDescription:
        '위시맵은 방문 인증에 첨부할 사진을 촬영하기 위해 카메라를 사용합니다.',
      NSMicrophoneUsageDescription:
        '위시맵은 방문 인증 영상 촬영 시 마이크를 사용합니다.',
      NSPhotoLibraryUsageDescription:
        '위시맵은 방문 인증에 첨부할 사진을 선택하기 위해 사진 라이브러리에 접근합니다.',
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
    './plugins/fix-entry-file',
    [
      'expo-build-properties',
      {
        android: {
          // 네이버 지도 / 카카오 SDK는 각 회사 전용 Maven에 있어 별도 등록 필요.
          extraMavenRepos: [
            'https://repository.map.naver.com/archive/maven',
            'https://devrepo.kakao.com/nexus/content/groups/public/',
          ],
        },
      },
    ],
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
      'expo-location',
      {
        locationWhenInUsePermission:
          '위시맵은 주변 장소를 지도에 표시하고, 방문 인증 시 가게와의 거리(100m 이내)를 확인하기 위해 위치 정보를 사용합니다.',
      },
    ],
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
