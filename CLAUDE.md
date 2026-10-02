# Wish Map App

Expo 55, React Native, Expo Router 기반의 장소별 파티 서비스. iOS, Android, 웹을 한 저장소에서 제공한다.

## 화면과 권한

- `app/(tabs)/index.tsx`: 비회원에게도 공개되는 파티 목록
- `app/party/[id].tsx`: 파티 상세, 참가 신청·취소, 주최자 승인·거절·취소
- `app/party/create.tsx`: 네이버 장소 검색을 이용한 파티 생성
- `app/login.tsx`: 웹과 모바일의 휴대폰 문자 인증 로그인
- `app/report.tsx`: 파티 신고
- 파티 생성과 참가에는 문자 인증 로그인이 필요하다.

## 빌드와 배포

- `npx tsc --noEmit`, `npx expo lint`
- 웹: `EXPO_PUBLIC_API_URL=https://api.wishmap.kr npx expo export --platform web`
- `render.yaml`: Render Static Site 설정. `dist`를 배포하고 모든 앱 경로를 `index.html`로 재작성한다.
- 모바일: EAS production 프로필. 스토어 제출 상태와 실제 공개 상태를 따로 확인한다.

웹 빌드에는 `EXPO_NO_DOTENV=1`을 사용하고 공개 환경 변수만 전달한다.
