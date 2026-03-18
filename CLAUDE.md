# Wish Map App

## 개요
회사 동료들과 함께 쓰는 맛집 공유 지도 서비스. Expo + React Native + TypeScript. iOS/Android 네이티브 전용 (웹 미지원).

## 기술 스택
- Expo ~54.0, React 19, React Native 0.81
- TypeScript ~5.9, Expo Router ~6.0
- Zustand 5 (상태관리)
- @mj-studio/react-native-naver-map (네이버 지도)
- expo-location (위치 - watchPositionAsync로 실시간 업데이트)
- axios (HTTP)
- @gorhom/bottom-sheet (바텀시트)
- react-native-reanimated, react-native-gesture-handler
- react-native-toast-message (토스트 알림)

## 소셜 로그인
- @react-native-seoul/kakao-login
- @react-native-seoul/naver-login
- @react-native-google-signin/google-signin
- expo-apple-authentication

## 프로젝트 구조
```
app/
├── (tabs)/              # 탭 화면
│   ├── _layout.tsx      # NativeTabs (지도, 맛집, 마이)
│   ├── index.tsx        # 지도 (메인) - 검색, 그룹 필터, 바텀시트
│   ├── list.tsx         # 맛집 리스트
│   ├── suggest.tsx      # 맛집 제안 (숨김 탭)
│   └── mypage.tsx       # 마이페이지
├── _layout.tsx          # Root Stack
├── login.tsx            # 로그인 (모달)
├── visit-review.tsx     # 맛집 제보 (태그/리뷰/사진)
├── group-manage.tsx     # 그룹 관리 (생성/초대/추방/양도)
├── restaurant/[id].tsx  # 맛집 상세
├── friends.tsx          # 친구
├── bookmarks.tsx        # 북마크
├── my-suggestions.tsx   # 내 제안
├── notifications/       # 알림
└── legal/               # 약관

components/
├── NaverMap.tsx          # 네이버 지도 래퍼
├── PlaceDetailSheet.tsx  # 장소 상세 바텀시트 (방문인증 + 맛집제보 버튼)
├── RestaurantCard.tsx    # 맛집 카드
├── CollectionSheet.tsx   # 컬렉션 바텀시트
├── ToastConfig.tsx       # 커스텀 토스트 (성공/에러/정보)
└── ...

api/
├── client.ts         # axios 인스턴스 (JWT 인터셉터, 토큰 자동 갱신)
├── restaurant.ts     # 맛집 API (CRUD, quickVisit, 그룹 필터)
├── group.ts          # 그룹 API (CRUD, 초대/추방/양도)
├── search.ts         # 네이버 검색 (백엔드 프록시)
├── auth.ts           # 인증 API
└── ...

stores/
├── authStore.ts      # 인증 상태 (user, token)
├── groupStore.ts     # 그룹 상태 (groups, selectedGroupId)
└── themeStore.ts     # 테마 (light/dark/system)

hooks/
├── useSearch.ts      # 검색 (디바운스 + 즉시검색)
└── useTheme.ts       # 테마 훅
```

## 핵심 기능
### 방문 인증
- 바텀시트에서 바로 처리 (별도 화면 없음)
- 가게 100m 이내 GPS 거리 확인 → quickVisit API 호출
- 단순 방문 카운트만 증가

### 맛집 제보
- 가게 100m 이내 GPS 거리 확인 → visit-review 화면 이동
- 태그 선택, 한줄 리뷰, 사진 첨부 가능
- quickVisit API로 자동 맛집 등록 + 리뷰

### 그룹 시스템
- 지도 화면 상단에 그룹 칩으로 선택/해제
- 그룹 선택 시 해당 그룹 구성원이 방문/제보한 맛집만 표시
- 그룹 관리: 생성, 닉네임으로 초대, 추방(그룹장), 양도(그룹장), 탈퇴
- 목적: 회사 동료들과 회사 근처 맛집 기록

### 좋아요 없음
- 좋아요 시스템 사용하지 않음
- 방문 카운트 기반으로 운영

## API 연동
- Base URL: `EXPO_PUBLIC_API_URL` (기본: http://localhost:8080)
- JWT 토큰: expo-secure-store 저장
- axios 인터셉터: 자동 토큰 첨부 + 401 시 자동 갱신
- 로그인 필요 시 router.push('/login')으로 이동 (토스트 아님)

## 디자인 시스템 (constants/theme.ts)
- Primary: #FF6B35 (오렌지)
- 다크모드 지원
- 토스트: 타입별 배경색 (성공=초록, 에러=빨강, 정보=오렌지)

## 빌드
```bash
# 개발 서버
npx expo start

# 네이티브 빌드 (EAS) - wish-map-app 디렉토리에서 실행
eas build --platform ios --profile development
eas build --platform ios --profile preview --local

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
- 별점 시스템 사용하지 않음
