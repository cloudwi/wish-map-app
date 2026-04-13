# 배포 작업 가이드

## 현재 상태 (v1.1.0 배포 완료)
- **앱스토어**: v1.1.0 배포 완료
- **강제 업데이트**: 활성화 완료 (모든 유저 1.1.0+)
- **백엔드**: `/places` + `/restaurants` 둘 다 동작 (하위 호환)
- **프론트 1.1.0**: `/places` 사용
- **DB**: `restaurants` 테이블명 유지 (변경 안 함)
- **클라이언트 강제 업데이트 코드**: 제거 완료 (426 핸들러, ForceUpdateModal, 폴링)

---

## 남은 작업 (1.1.0 강제 업데이트 완료 후)

### 백엔드: 테이블명 변경
```sql
ALTER TABLE restaurants RENAME TO places;
ALTER TABLE restaurant_images RENAME TO place_images;
-- 외래키, 인덱스 등도 함께 변경 필요
```
- 엔티티 `@Table(name = "places")` 변경
- 네이티브 쿼리 테이블명 변경
- 백엔드 `/restaurants` 엔드포인트 제거

### 백엔드: 투표 테이블명 정리
- `lunch_votes` → `menu_votes` (점심 투표가 아닌 메뉴 투표)
- `lunch_vote_candidates` → `menu_vote_candidates`
- `lunch_vote_selections` → `menu_vote_selections`
- 관련 엔티티/서비스/컨트롤러/프론트 코드도 함께 변경

### 코드 정리
- `Restaurant` → `Place` 타입/엔티티명 변경 (프론트/백엔드)
- `RestaurantController` → `PlaceController` 클래스명 변경
- `RestaurantService` → `PlaceService` 클래스명 변경
