import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { useState, useCallback } from 'react';
import { Ionicons } from '@expo/vector-icons';
import type * as LocationType from 'expo-location';
import { type NaverMapViewRef } from '@mj-studio/react-native-naver-map';
import { useTheme } from '../../hooks/useTheme';
import { lightTap, mediumTap } from '../../utils/haptics';
import { showError } from '../../utils/toast';

interface MapControlsProps {
  mapRef: React.RefObject<NaverMapViewRef | null>;
  currentCameraRef: React.MutableRefObject<{ latitude: number; longitude: number; zoom: number }>;
  onLocationUpdate?: (location: { latitude: number; longitude: number }) => void;
}

export function MapControls({ mapRef, currentCameraRef, onLocationUpdate }: MapControlsProps) {
  const c = useTheme();
  const [locating, setLocating] = useState(false);

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
      // 마지막 알려진 위치 먼저 시도 → 없으면 현재 위치 요청
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
      <TouchableOpacity
        style={[styles.mapBtn, { backgroundColor: c.surface }]}
        onPress={() => {
          lightTap();
          const cam = currentCameraRef.current;
          mapRef.current?.animateCameraTo({ latitude: cam.latitude, longitude: cam.longitude, zoom: cam.zoom + 1, duration: 200 });
        }}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={22} color={c.textSecondary} />
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.mapBtn, { backgroundColor: c.surface }]}
        onPress={() => {
          lightTap();
          const cam = currentCameraRef.current;
          mapRef.current?.animateCameraTo({ latitude: cam.latitude, longitude: cam.longitude, zoom: cam.zoom - 1, duration: 200 });
        }}
        activeOpacity={0.8}
      >
        <Ionicons name="remove" size={22} color={c.textSecondary} />
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.mapBtn, { backgroundColor: c.surface, marginTop: 4 }]}
        onPress={goToMyLocation}
        activeOpacity={0.8}
        disabled={locating}
      >
        <Ionicons
          name={locating ? 'locate' : 'locate-outline'}
          size={22}
          color={locating ? c.primary : c.textSecondary}
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  rightButtons: {
    position: 'absolute',
    right: 16,
    top: '45%',
    zIndex: 1,
    elevation: 2,
    gap: 8,
  },
  mapBtn: {
    width: 44,
    height: 44,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
});
