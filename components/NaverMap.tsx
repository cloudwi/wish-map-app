// Native (iOS/Android) - 네이버 지도 네이티브 SDK
import { useCallback, forwardRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  NaverMapView,
  NaverMapMarkerOverlay,
  NaverMapCircleOverlay,
  type Camera,
  type Region,
  type NaverMapViewRef,
} from '@mj-studio/react-native-naver-map';
import { Restaurant, MapBounds, PlaceCategory } from '../types';
import { PlaceResult } from '../api/search';

interface Props {
  restaurants: Restaurant[];
  placeCategories?: PlaceCategory[];
  onMarkerClick: (restaurant: Restaurant) => void;
  onBoundsChange: (bounds: MapBounds, camera: { latitude: number; longitude: number; zoom: number }) => void;
  onTapMap?: (lat: number, lng: number) => void;
  userLocation?: { latitude: number; longitude: number } | null;
  selectedPlace?: PlaceResult | null;
  selectedId?: number | null;
  selectedCategoryId?: number | null;
  tappedLocation?: { latitude: number; longitude: number } | null;
  initialLat?: number;
  initialLng?: number;
  initialZoom?: number;
}

function getCategoryIcon(placeCategoryId: number | null, placeCategories?: PlaceCategory[]): string {
  if (placeCategoryId && placeCategories) {
    const cat = placeCategories.find(c => c.id === placeCategoryId);
    // icon은 Ionicons name (영문 소문자+하이픈)이어야 함. 이모지 등은 무시
    if (cat?.icon && /^[a-z][a-z0-9-]*$/.test(cat.icon)) return cat.icon;
  }
  return 'restaurant';
}

const NaverMap = forwardRef<NaverMapViewRef, Props>(({
  restaurants,
  placeCategories,
  onMarkerClick,
  onBoundsChange,
  onTapMap,
  userLocation,
  selectedPlace,
  selectedId,
  selectedCategoryId,
  tappedLocation,
  initialLat = 37.5665,
  initialLng = 126.9780,
  initialZoom = 14,
}, ref) => {
  const handleCameraChanged = useCallback(
    (params: Camera & { reason: any; region: Region }) => {
      const { region } = params;
      onBoundsChange(
        {
          minLat: region.latitude,
          maxLat: region.latitude + region.latitudeDelta,
          minLng: region.longitude,
          maxLng: region.longitude + region.longitudeDelta,
        },
        { latitude: params.latitude, longitude: params.longitude, zoom: params.zoom ?? 14 },
      );
    },
    [onBoundsChange],
  );

  return (
    <NaverMapView
      ref={ref}
      style={StyleSheet.absoluteFill}
      initialCamera={{
        latitude: initialLat,
        longitude: initialLng,
        zoom: initialZoom,
      }}
      onCameraChanged={handleCameraChanged}
      onTapMap={onTapMap ? (params) => onTapMap(params.latitude, params.longitude) : undefined}
      isShowZoomControls={false}
      isShowCompass
      isShowLocationButton={false}
      mapPadding={{ top: 120, bottom: 150 }}
    >
      {/* 동그라미 마커 + 포크 문양 */}
      {restaurants.filter((r) => !selectedPlace || (r.lat !== selectedPlace.lat || r.lng !== selectedPlace.lng)).map((r) => {
        const hasVisits = r.visitCount > 0;
        const hasChampion = !!r.weeklyChampion;
        const isActive = hasChampion || hasVisits;
        const size = hasChampion ? 28 : 24;
        const color = isActive ? '#FF8A65' : '#C5C9CF';

        return (
          <NaverMapMarkerOverlay
            key={r.id}
            latitude={r.lat}
            longitude={r.lng}
            anchor={{ x: 0.5, y: 0.5 }}
            width={size}
            height={size}
            zIndex={hasChampion ? 50 : 0}
            onTap={() => onMarkerClick(r)}
          >
            <View collapsable={false} style={[styles.dot, { width: size, height: size, borderRadius: size / 2, backgroundColor: color }]}>
              <Ionicons name={getCategoryIcon(r.placeCategoryId, placeCategories) as any} size={size * 0.5} color="rgba(255,255,255,0.9)" />
            </View>
          </NaverMapMarkerOverlay>
        );
      })}

      {/* 검색 선택 장소 */}
      {selectedPlace && (
        <NaverMapMarkerOverlay
          key={`place-${selectedPlace.id}`}
          latitude={selectedPlace.lat}
          longitude={selectedPlace.lng}
          anchor={{ x: 0.5, y: 0.5 }}
          width={28}
          height={28}
          caption={undefined}
          zIndex={200}
        >
          <View collapsable={false} style={[styles.dot, { width: 28, height: 28, borderRadius: 14, backgroundColor: '#FF8A65' }]}>
            <Ionicons name={getCategoryIcon(selectedCategoryId ?? null, placeCategories) as any} size={14} color="rgba(255,255,255,0.9)" />
          </View>
        </NaverMapMarkerOverlay>
      )}

      {/* 탭한 위치 핀 */}
      {tappedLocation && (
        <NaverMapMarkerOverlay
          latitude={tappedLocation.latitude}
          longitude={tappedLocation.longitude}
          anchor={{ x: 0.5, y: 1 }}
          width={28}
          height={36}
          zIndex={100}
        >
          <View collapsable={false} style={styles.tappedPin}>
            <Ionicons name="location" size={36} color="#E8590C" />
          </View>
        </NaverMapMarkerOverlay>
      )}

      {/* 내 위치 마커 */}
      {userLocation && (
        <>
          <NaverMapCircleOverlay
            latitude={userLocation.latitude}
            longitude={userLocation.longitude}
            radius={40}
            color="rgba(74, 144, 217, 0.15)"
            outlineColor="rgba(74, 144, 217, 0.3)"
            outlineWidth={1}
          />
          <NaverMapMarkerOverlay
            latitude={userLocation.latitude}
            longitude={userLocation.longitude}
            anchor={{ x: 0.5, y: 0.5 }}
            width={16}
            height={16}
            caption={undefined}
          >
            <View style={myLocationStyles.dot} />
          </NaverMapMarkerOverlay>
        </>
      )}
    </NaverMapView>
  );
});

const styles = StyleSheet.create({
  dot: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tappedPin: {
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
});

const myLocationStyles = StyleSheet.create({
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#4A90D9',
    borderWidth: 2.5,
    borderColor: '#fff',
    shadowColor: '#4A90D9',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 4,
  },
});

NaverMap.displayName = 'NaverMap';
export default NaverMap;
