# Wish Map App

## 개요
회사 동료들과 함께 쓰는 맛집 공유 지도 서비스. Expo + React Native + TypeScript. iOS/Android 네이티브 전용 (웹 미지원).
- **Bundle ID**: `com.wishmap.app`
- **URL Scheme**: `wishmap`
- **New Architecture**: 활성화 (React Compiler + Typed Routes 포함)

## 기술 스택
- Expo ~55, React 19, React Native 0.83
- TypeScript ~5.9 (strict mode), Expo Router ~55.0
- Zustand 5 (상태관리, expo-secure-store로 persist)
- @mj-studio/react-native-naver-map (네이버 지도)
- expo-location (위치 - watchPositionAsync로 실시간 업데이트)
- axios (HTTP, 10초 타임아웃)
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
├── (tabs)/              # 탭 화면 (NativeTabs)
│   ├── _layout.tsx      # NativeTabs (지도, 장소, 마이) + 약관동의 모달
│   ├── index.tsx        # 지도 (메인) - 검색, 가격대 필터, 그룹 필터, 바텀시트
│   ├── list.tsx         # 맛집 리스트
│   └── mypage.tsx       # 마이페이지
├── _layout.tsx          # Root Stack + 푸시알림 설정 + 강제업데이트 감지
├── login.tsx            # 로그인 (모달)
├── visit-review.tsx     # 방문 리뷰 (가격대/테마별 태그/사진/한줄평)
├── group-manage.tsx     # 그룹 관리 (생성/초대/추방/양도)
├── restaurant/[id].tsx  # 맛집 상세
├── friends.tsx          # 친구
├── my-suggestions.tsx   # 내 제안
├── blocked-users.tsx    # 차단 사용자
├── notifications/       # 알림
└── legal/               # 약관

components/
├── NaverMap.tsx          # 네이버 지도 래퍼
├── PlaceDetailSheet.tsx  # 장소 상세 바텀시트 (정보 표시 + 방문인증 navigate)
├── RestaurantCard.tsx    # 맛집 카드
├── TaggedContent.tsx     # 태그 파싱/표시 컴포넌트
├── ToastConfig.tsx       # 커스텀 토스트 (성공/에러/정보)
├── TermsAgreementModal.tsx  # 약관 동의 모달
├── ReportModal.tsx       # 신고 모달
├── AuthRequired.tsx      # 인증 필요 래퍼
├── map/
│   ├── SearchBar.tsx     # 검색바 + 가격대 드롭다운 필터
│   ├── GroupChip.tsx     # 그룹 선택 칩
│   └── MapControls.tsx   # 줌/내위치 버튼
└── ...

api/
├── client.ts         # axios 인스턴스 (JWT 인터셉터, 토큰 자동 갱신, 강제업데이트)
├── restaurant.ts     # 맛집 API (CRUD, quickVisit, 가격대 필터, 그룹 필터)
├── comment.ts        # 댓글 API (CRUD, 이미지 첨부)
├── group.ts          # 그룹 API (CRUD, 초대/추방/양도)
├── search.ts         # 네이버 검색 (백엔드 프록시, 이미지 캐시)
├── auth.ts           # 인증 API
├── agreement.ts      # 약관 동의 API
├── friend.ts         # 친구 API
├── notification.ts   # 알림 API
├── block.ts          # 차단 API
├── report.ts         # 신고 API
├── category.ts       # 장소 카테고리 API
└── index.ts          # API 모듈 re-export

stores/
├── authStore.ts      # 인증 상태 (user, token, termsAgreement)
├── groupStore.ts     # 그룹 상태 (groups, selectedGroupId - 토글 방식)
└── themeStore.ts     # 테마 (light/dark/system, secure-store 저장)

hooks/
├── useSearch.ts      # 검색 (디바운스 + 즉시검색)
└── useTheme.ts       # 테마 훅
```

## 핵심 기능
### 방문 인증 + 리뷰
- 바텀시트에서 [방문 인증] 탭 → visit-review 전체화면 이동
- 가격대 선택 (필수) + 테마별 태그 (선택) + 한줄평/사진 (선택)
- GPS 100m 이내 확인 → quickVisit API (가격대 + 리뷰 데이터 포함)
- 태그 테마: 분위기, 맛 특징, 편의, 한줄평
- 이미지 최대 5장 첨부 가능

### 가격대 필터
- 검색바 내 드롭다운으로 가격대 필터 (1만원이하 ~ 3만원이상)
- 서버사이드 필터링 (Restaurant.priceRange 캐시 기반)
- enum: UNDER_10K, RANGE_10K, RANGE_20K, RANGE_30K, OVER_30K

### 그룹 시스템
- 지도 화면 상단에 그룹 칩으로 선택/해제 (토글 방식)
- 그룹 선택 시 해당 그룹 구성원이 방문/제보한 맛집만 표시
- 그룹 관리: 생성, 닉네임으로 초대, 추방(그룹장), 양도(그룹장), 탈퇴

### 좋아요/별점 없음
- 좋아요·별점 시스템 사용하지 않음
- 방문 카운트 기반으로 운영

## API 연동
- **Base URL**: `${EXPO_PUBLIC_API_URL}/api/v1` (기본: http://localhost:8080/api/v1)
- **JWT 토큰**: expo-secure-store 저장 (accessToken, refreshToken)
- **요청 헤더**: Bearer 토큰 + `X-App-Version` + `X-App-Platform`
- **응답 인터셉터**:
  - 401 → 토큰 자동 갱신 (동시 요청 큐잉) → 원래 요청 재시도
  - 403 → 강제 로그아웃 (계정 삭제/초기화 시나리오)
- 로그인 필요 시 router.push('/login')으로 이동

## 디자인 시스템 (constants/theme.ts)
- **Primary**: #E8590C (오렌지)
- **다크모드 지원** (system/light/dark)
- **타이포그래피**: h1-h3, body1-3, caption1-3 (크기·굵기로 위계)
- **스페이싱**: xs(4) → xxxl(32), 4단위 증분
- **보더 반경**: sm(6), md(8), lg(10), xl(12), full(9999)
- **시맨틱 컬러**: success(#4CAF50), error(#FF4444), warning(#FF9800), info(#2196F3)
- 토스트: 타입별 배경색 (성공=초록, 에러=빨강, 정보=오렌지)

## 빌드
```bash
# 개발 서버
npx expo start

# 네이티브 빌드 (EAS) - wish-map-app 디렉토리에서 실행
eas build --platform ios --profile development
eas build --platform ios --profile preview --local
eas build --platform ios --profile production

# 스토어 제출
eas submit --platform ios --profile production

# 로컬 빌드
npx expo prebuild
npx expo run:ios

# 린트
npx expo lint
```

## 환경변수 (.env)
```
EXPO_PUBLIC_API_URL                # 백엔드 API URL (기본: http://localhost:8080)
KAKAO_APP_KEY                      # 카카오 네이티브 앱 키
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID   # Google OAuth iOS 클라이언트 ID
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID   # Google OAuth Web 클라이언트 ID (백엔드 검증용)
EXPO_PUBLIC_NAVER_CONSUMER_KEY     # 네이버 OAuth 클라이언트 ID
EXPO_PUBLIC_NAVER_CONSUMER_SECRET  # 네이버 OAuth 클라이언트 시크릿
EXPO_PUBLIC_APPLE_SERVICE_ID       # Apple 서비스 ID
EXPO_PUBLIC_NAVER_MAP_CLIENT_ID    # 네이버 지도 클라이언트 ID
```

## EAS 빌드 프로필 (eas.json)
- **development**: developmentClient + internal 배포
- **preview**: internal 배포
- **production**: autoIncrement + 프로덕션 env 주입 (api.wishmap.kr)
- **submit**: iOS App Store (ascAppId: 6760577746)

## 디자인 원칙
- **해외 서비스 스타일의 단순한 UX/UI를 추구** (미니멀, 깔끔, 직관적)
- 불필요한 장식 요소 최소화, 핵심 기능에 집중
- 화면 전환 최소화, 인라인 인터랙션 선호
- 컬러 팔레트 절제: Primary(오렌지) + 중립색 중심
- 타이포그래피: 가독성 우선, 굵기/크기 변화로 위계 표현

## 컨벤션
- 커밋: `feat:`, `fix:` 등 한국어 메시지
- Co-Authored-By 포함하지 않음
- UX 최우선: 불필요한 입력 제거, auto-advance, 시각적 피드백
- 앱 전용 (웹 미지원)
- 별점 시스템 사용하지 않음
- ESLint: eslint-config-expo flat config 사용
- 테스트 없음 (jest/vitest 미설정)

## 알려진 이슈 / TODO
- **스플래시 다크 아이콘**: splash-icon-dark.png이 현재 라이트 버전 복사본. 다크 배경에 맞는 밝은 색상 아이콘으로 교체 필요
