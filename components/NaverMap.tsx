// Native (iOS/Android) - 네이버 지도 네이티브 SDK
import { useCallback } from 'react';
import { StyleSheet } from 'react-native';
import {
  NaverMapView,
  NaverMapMarkerOverlay,
  type Camera,
  type Region,
} from '@mj-studio/react-native-naver-map';
import { Restaurant, MapBounds } from '../types';

interface Props {
  restaurants: Restaurant[];
  onMarkerClick: (restaurant: Restaurant) => void;
  onBoundsChange: (bounds: MapBounds) => void;
  initialLat?: number;
  initialLng?: number;
  initialZoom?: number;
}

export default function NaverMap({
  restaurants,
  onMarkerClick,
  onBoundsChange,
  initialLat = 37.5665,
  initialLng = 126.9780,
  initialZoom = 14,
}: Props) {
  const handleCameraChanged = useCallback(
    (params: Camera & { reason: number; region: Region }) => {
      const { region } = params;
      onBoundsChange({
        minLat: region.latitude,
        maxLat: region.latitude + region.latitudeDelta,
        minLng: region.longitude,
        maxLng: region.longitude + region.longitudeDelta,
      });
    },
    [onBoundsChange],
  );

  return (
    <NaverMapView
      style={StyleSheet.absoluteFill}
      initialCamera={{
        latitude: initialLat,
        longitude: initialLng,
        zoom: initialZoom,
      }}
      onCameraChanged={handleCameraChanged}
      isShowZoomControls
      isShowCompass
    >
      {restaurants.map((r) => (
        <NaverMapMarkerOverlay
          key={r.id}
          latitude={r.lat}
          longitude={r.lng}
          caption={{ text: r.name }}
          onTap={() => onMarkerClick(r)}
        />
      ))}
    </NaverMapView>
  );
}
