# Wish Map App

## 개요
맛집 공유 지도 서비스 앱. Expo + React Native + TypeScript. 네이티브 앱 전용 (웹 미지원).

## 기술 스택
- Expo ~54.0, React 19, React Native 0.81
- TypeScript ~5.9, Expo Router ~6.0
- Zustand 5 (상태관리)
- @mj-studio/react-native-naver-map (네이버 지도)
- expo-location (위치)
- axios (HTTP)
- @gorhom/bottom-sheet (바텀시트)
- react-native-reanimated, react-native-gesture-handler

## 소셜 로그인
- @react-native-seoul/kakao-login
- @react-native-seoul/naver-login
- @react-native-google-signin/google-signin
- expo-apple-authentication

## 프로젝트 구조
```
app/
├── (tabs)/          # 탭 화면 (index=지도, list=맛집, suggest, mypage)
├── login.tsx        # 로그인 (모달)
├── restaurant/      # 맛집 상세
├── bookmarks.tsx
├── my-suggestions.tsx
├── notifications/
└── legal/

components/          # NaverMap, RestaurantCard, FloatingActionButton, AuthRequired 등
api/                 # client.ts(axios), auth.ts, restaurant.ts, comment.ts, search.ts
stores/              # Zustand 스토어
types/               # TypeScript 타입
constants/           # theme.ts (디자인 시스템)
```

## API 연동
- Base URL: `EXPO_PUBLIC_API_URL` (기본: http://localhost:8080)
- JWT 토큰: expo-secure-store 저장
- axios 인터셉터: 자동 토큰 첨부 + 401 시 자동 갱신

## 디자인 시스템 (constants/theme.ts)
- Primary: #FF6B35 (오렌지)
- 토스 스타일: colors, typography, spacing, radius, shadow

## 네비게이션
- Root: Stack (모달 지원)
- Main: Bottom Tab (지도, 맛집, 마이페이지)
- suggest 탭은 숨김 (FAB으로 진입)

## 빌드
```bash
# 개발 서버
npx expo start

# 네이티브 빌드 (EAS)
eas build --platform ios --profile development
eas build --platform ios --profile preview  # TestFlight용

# 로컬 빌드
npx expo prebuild
npx expo run:ios
```

## 환경변수
EXPO_PUBLIC_API_URL, EXPO_PUBLIC_NAVER_MAP_CLIENT_ID,
EXPO_PUBLIC_NAVER_SEARCH_CLIENT_ID, EXPO_PUBLIC_NAVER_SEARCH_CLIENT_SECRET,
각 OAuth 키 (KAKAO, GOOGLE, NAVER, APPLE)

## 컨벤션
- 커밋: `feat:`, `fix:` 등 한국어 메시지
- Co-Authored-By 포함하지 않음
- UX 최우선: 불필요한 입력 제거, auto-advance, 시각적 피드백
- 앱 전용 (웹 미지원)
