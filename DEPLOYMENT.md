# v1.1.0 배포 + 강제 업데이트 작업 가이드

## 변경사항 요약 (v1.0.5 → v1.1.0)
- Expo SDK 54 → 55, React Native 0.81 → 0.83
- API URL `/restaurants` → `/places` 변경 (백엔드는 둘 다 지원)
- 장소 탭 통계/랭킹 (이번 주 HOT)
- 거리순/방문순/최근 방문순 서버 페이지네이션
- 바텀시트 무한 스크롤
- 공유하기 버튼 + 슬롯머신 메뉴 추천
- 최근 방문일 표시
- likes/like_groups 테이블 삭제
- NativeTabs SDK 55 API 대응

---

## 배포 순서

### 1단계: 앱스토어 빌드 & 제출
```bash
cd wish-map-app
eas build --platform ios --profile production
eas submit --platform ios
```
- Apple 심사 통과 대기

### 2단계: 백엔드 배포
- 프로덕션 백엔드 배포 (Render 자동 배포 또는 수동)
- 자동 적용되는 마이그레이션:
  - `V32__drop_likes_tables.sql` — likes, like_groups 테이블 DROP
  - `V33__force_update_1_0_5.sql` — ⚠️ 현재 min_version이 1.0.5로 설정됨
- `/places` 엔드포인트 + 통계 API + 거리순 정렬 활성화

### 3단계: 강제 업데이트 활성화 (앱스토어 배포 완료 후!)
⚠️ **반드시 앱스토어에 1.1.0이 배포 완료된 후 실행**

`V33`을 수정하거나 새 마이그레이션 추가:
```sql
-- V34__force_update_1_1_0.sql
UPDATE app_version_control
SET min_version = '1.1.0',
    latest_version = '1.1.0',
    force_update = TRUE,
    updated_at = NOW();
```

### 4단계: 검증
- [ ] 1.0.x 앱 → 강제 업데이트 모달 표시 확인
- [ ] 1.1.0 앱 → `/places` API 정상 동작
- [ ] 거리순 정렬 동작
- [ ] 이번 주 HOT 통계 표시
- [ ] 슬롯 메뉴 추천 동작
- [ ] 공유하기 버튼 동작
- [ ] 최근 방문일 표시

---

## 나중에 할 작업 (1.1.0 강제 업데이트 후)

### 테이블명 변경
모든 유저가 1.1.0+ 확인 후:
```sql
ALTER TABLE restaurants RENAME TO places;
ALTER TABLE restaurant_images RENAME TO place_images;
-- 외래키, 인덱스 등도 함께 변경 필요
```
- 엔티티 `@Table(name = "places")` 변경
- 네이티브 쿼리 테이블명 변경
- 백엔드 `/restaurants` 엔드포인트 제거

### 테이블명 정리 (추가)
- `lunch_votes` → `menu_votes` (점심 투표가 아닌 메뉴 투표)
- `lunch_vote_candidates` → `menu_vote_candidates`
- `lunch_vote_selections` → `menu_vote_selections`
- 관련 엔티티/서비스/컨트롤러/프론트 코드도 함께 변경

### 코드 정리
- `Restaurant` → `Place` 타입/엔티티명 변경 (프론트/백엔드)
- `RestaurantController` → `PlaceController` 클래스명 변경
- `RestaurantService` → `PlaceService` 클래스명 변경

---

## 현재 상태
- **백엔드**: `/places` + `/restaurants` 둘 다 동작 (하위 호환)
- **프론트 1.1.0**: `/places` 사용
- **프론트 1.0.x**: `/restaurants` 사용
- **DB**: `restaurants` 테이블명 유지 (변경 안 함)
- **V33 마이그레이션**: min_version = 1.0.5 (1.1.0으로 수정 필요)
