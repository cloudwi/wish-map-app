import { StyleSheet, View } from 'react-native';
import { useState, useCallback } from 'react';
import type * as LocationType from 'expo-location';
import { type NaverMapViewRef } from '@mj-studio/react-native-naver-map';
import { useTheme } from '../../hooks/useTheme';
import { lightTap, mediumTap } from '../../utils/haptics';
import { showError } from '../../utils/toast';
import { GlassIconButton } from '../GlassIconButton';

interface MapControlsProps {
  mapRef: React.RefObject<NaverMapViewRef | null>;
  currentCameraRef: React.MutableRefObject<{ latitude: number; longitude: number; zoom: number }>;
  onLocationUpdate?: (location: { latitude: number; longitude: number }) => void;
  onRecommend?: () => void;
}

const BTN_SIZE = 44;
const BTN_RADIUS = 10;

export function MapControls({ mapRef, currentCameraRef, onLocationUpdate, onRecommend }: MapControlsProps) {
  const c = useTheme();
  const [locating, setLocating] = useState(false);

  const zoomIn = useCallback(() => {
    lightTap();
    const cam = currentCameraRef.current;
    mapRef.current?.animateCameraTo({ latitude: cam.latitude, longitude: cam.longitude, zoom: cam.zoom + 1, duration: 200 });
  }, [mapRef, currentCameraRef]);

  const zoomOut = useCallback(() => {
    lightTap();
    const cam = currentCameraRef.current;
    mapRef.current?.animateCameraTo({ latitude: cam.latitude, longitude: cam.longitude, zoom: cam.zoom - 1, duration: 200 });
  }, [mapRef, currentCameraRef]);

  const goToMyLocation = useCallback(async () => {
    mediumTap();
    setLocating(true);
    try {
      const Location = require('expo-location') as typeof LocationType;
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        showError('위치 권한 필요', '설정에서 위치 권한을 허용해주세요.');
        return;
      }
      let location = await Location.getLastKnownPositionAsync();
      if (!location) {
        location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      }
      onLocationUpdate?.({ latitude: location.coords.latitude, longitude: location.coords.longitude });
      mapRef.current?.animateCameraTo({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        zoom: currentCameraRef.current.zoom,
      });
    } catch {
      showError('위치 오류', '현재 위치를 가져올 수 없습니다.');
    } finally {
      setLocating(false);
    }
  }, [mapRef, currentCameraRef, onLocationUpdate]);

  return (
    <View style={styles.rightButtons}>
      <GlassIconButton
        icon="plus"
        onPress={zoomIn}
        size={BTN_SIZE}
        borderRadius={BTN_RADIUS}
        iconColor={c.textSecondary}
        iconSize={20}
        accessibilityLabel="확대"
      />
      <GlassIconButton
        icon="minus"
        onPress={zoomOut}
        size={BTN_SIZE}
        borderRadius={BTN_RADIUS}
        iconColor={c.textSecondary}
        iconSize={20}
        accessibilityLabel="축소"
      />
      <GlassIconButton
        icon={locating ? 'location.fill' : 'location'}
        onPress={goToMyLocation}
        size={BTN_SIZE}
        borderRadius={BTN_RADIUS}
        iconColor={locating ? c.primary : c.textSecondary}
        iconSize={20}
        disabled={locating}
        style={{ marginTop: 4 }}
        accessibilityLabel="내 위치"
      />
      {onRecommend && (
        <GlassIconButton
          icon="dice"
          onPress={onRecommend}
          size={BTN_SIZE}
          borderRadius={BTN_RADIUS}
          tintColor={c.primary}
          iconColor="#fff"
          iconSize={20}
          accessibilityLabel="추천"
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  rightButtons: {
    position: 'absolute',
    right: 16,
    top: '45%',
    zIndex: 1,
    gap: 8,
  },
});
