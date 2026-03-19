// Native (iOS/Android) - 네이버 지도 네이티브 SDK
import { useCallback, forwardRef } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  NaverMapView,
  NaverMapMarkerOverlay,
  NaverMapCircleOverlay,
  type Camera,
  type Region,
  type NaverMapViewRef,
} from '@mj-studio/react-native-naver-map';
import { Restaurant, MapBounds } from '../types';
import { PlaceResult } from '../api/search';

interface Props {
  restaurants: Restaurant[];
  onMarkerClick: (restaurant: Restaurant) => void;
  onBoundsChange: (bounds: MapBounds, camera: { latitude: number; longitude: number; zoom: number }) => void;
  userLocation?: { latitude: number; longitude: number } | null;
  selectedPlace?: PlaceResult | null;
  selectedId?: number | null;
  initialLat?: number;
  initialLng?: number;
  initialZoom?: number;
}

const NaverMap = forwardRef<NaverMapViewRef, Props>(({
  restaurants,
  onMarkerClick,
  onBoundsChange,
  userLocation,
  selectedPlace,
  selectedId,
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
      isShowZoomControls={false}
      isShowCompass
      isShowLocationButton={false}
      mapPadding={{ top: 120, bottom: 150 }}
    >
      {restaurants.filter((r) => !selectedPlace || (r.lat !== selectedPlace.lat || r.lng !== selectedPlace.lng)).map((r) => {
        const isSelected = selectedId === r.id;
        const hasVisits = r.visitCount > 0;
        return (
          <NaverMapMarkerOverlay
            key={r.id}
            latitude={r.lat}
            longitude={r.lng}
            width={isSelected ? 32 : 24}
            height={isSelected ? 44 : 34}
            caption={
              isSelected
                ? { text: r.name, color: '#FF6B35', textSize: 13 }
                : hasVisits
                  ? { text: `${r.visitCount}`, color: '#fff', textSize: 10, haloColor: '#FF6B35' }
                  : undefined
            }
            subCaption={isSelected && hasVisits ? { text: `${r.visitCount}회 방문`, color: '#FF6B35' } : undefined}
            image={{ symbol: hasVisits ? 'red' : 'gray' }}
            zIndex={isSelected ? 100 : 0}
            onTap={() => onMarkerClick(r)}
          />
        );
      })}
      {selectedPlace && (
        <NaverMapMarkerOverlay
          key={`place-${selectedPlace.id}`}
          latitude={selectedPlace.lat}
          longitude={selectedPlace.lng}
          width={30}
          height={40}
          image={{ symbol: 'blue' }}
          caption={{ text: selectedPlace.name, color: '#4A90D9', textSize: 13, haloColor: '#fff' }}
          zIndex={200}
        />
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
