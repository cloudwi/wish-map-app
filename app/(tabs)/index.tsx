import { StyleSheet, View, Text, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useState, useEffect, useRef } from 'react';
import { WebView } from 'react-native-webview';
import { router } from 'expo-router';
import { Restaurant, MapBounds } from '../../types';
import { restaurantApi } from '../../api/restaurant';

const NAVER_MAP_CLIENT_ID = process.env.EXPO_PUBLIC_NAVER_MAP_CLIENT_ID || '';

// 서울 중심 좌표
const INITIAL_REGION = {
  lat: 37.5665,
  lng: 126.9780,
  zoom: 14,
};

export default function MapScreen() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const webViewRef = useRef<WebView>(null);

  const fetchRestaurants = async (bounds: MapBounds) => {
    try {
      const response = await restaurantApi.getRestaurants(bounds);
      setRestaurants(response.content);
    } catch (error) {
      console.error('Failed to fetch restaurants:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // 초기 서울 범위로 맛집 로드
    fetchRestaurants({
      minLat: 37.4,
      maxLat: 37.7,
      minLng: 126.8,
      maxLng: 127.2,
    });
  }, []);

  // 네이버 지도 HTML
  const mapHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
      <style>
        * { margin: 0; padding: 0; }
        html, body, #map { width: 100%; height: 100%; }
      </style>
      <script src="https://oapi.map.naver.com/openapi/v3/maps.js?ncpClientId=${NAVER_MAP_CLIENT_ID}"></script>
    </head>
    <body>
      <div id="map"></div>
      <script>
        const map = new naver.maps.Map('map', {
          center: new naver.maps.LatLng(${INITIAL_REGION.lat}, ${INITIAL_REGION.lng}),
          zoom: ${INITIAL_REGION.zoom},
          zoomControl: true,
          zoomControlOptions: {
            position: naver.maps.Position.RIGHT_CENTER
          }
        });

        const markers = [];

        // 마커 추가 함수
        window.addMarkers = function(restaurantsJson) {
          // 기존 마커 제거
          markers.forEach(m => m.setMap(null));
          markers.length = 0;

          const restaurants = JSON.parse(restaurantsJson);
          restaurants.forEach(r => {
            const marker = new naver.maps.Marker({
              position: new naver.maps.LatLng(r.lat, r.lng),
              map: map,
              title: r.name
            });

            naver.maps.Event.addListener(marker, 'click', () => {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'markerClick',
                restaurant: r
              }));
            });

            markers.push(marker);
          });
        };

        // 지도 이동 시 범위 전송
        naver.maps.Event.addListener(map, 'idle', () => {
          const bounds = map.getBounds();
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'boundsChanged',
            bounds: {
              minLat: bounds.getSW().lat(),
              maxLat: bounds.getNE().lat(),
              minLng: bounds.getSW().lng(),
              maxLng: bounds.getNE().lng()
            }
          }));
        });
      </script>
    </body>
    </html>
  `;

  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      
      if (data.type === 'markerClick') {
        setSelectedRestaurant(data.restaurant);
      } else if (data.type === 'boundsChanged') {
        fetchRestaurants(data.bounds);
      }
    } catch (error) {
      console.error('Failed to parse message:', error);
    }
  };

  // 마커 업데이트
  useEffect(() => {
    if (webViewRef.current && restaurants.length > 0) {
      const script = `window.addMarkers('${JSON.stringify(restaurants).replace(/'/g, "\\'")}');`;
      webViewRef.current.injectJavaScript(script);
    }
  }, [restaurants]);

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        source={{ html: mapHTML }}
        style={styles.map}
        onMessage={handleMessage}
        javaScriptEnabled={true}
      />
      
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#FF6B35" />
        </View>
      )}

      {/* 선택된 맛집 바텀시트 */}
      {selectedRestaurant && (
        <TouchableOpacity 
          style={styles.bottomSheet}
          onPress={() => router.push(`/restaurant/${selectedRestaurant.id}`)}
          activeOpacity={0.9}
        >
          <View style={styles.bottomSheetHandle} />
          <Text style={styles.restaurantName}>{selectedRestaurant.name}</Text>
          <Text style={styles.restaurantAddress}>{selectedRestaurant.address}</Text>
          <View style={styles.restaurantMeta}>
            {selectedRestaurant.category && (
              <Text style={styles.category}>{selectedRestaurant.category}</Text>
            )}
            <Text style={styles.likes}>❤️ {selectedRestaurant.likeCount}</Text>
          </View>
          <TouchableOpacity 
            style={styles.closeButton}
            onPress={() => setSelectedRestaurant(null)}
          >
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  bottomSheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#ddd',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 15,
  },
  restaurantName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  restaurantAddress: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  restaurantMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  category: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    fontSize: 13,
    color: '#666',
  },
  likes: {
    fontSize: 14,
    color: '#FF6B35',
  },
  closeButton: {
    position: 'absolute',
    top: 15,
    right: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 18,
    color: '#999',
  },
});
