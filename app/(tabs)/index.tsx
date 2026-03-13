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

// 컴포넌트 외부에 정의 (매 렌더마다 재생성 방지)
const mapHTML = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <style>
      * { margin: 0; padding: 0; }
      html, body, #map { width: 100%; height: 100%; }
      #error { display:none; position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); color:red; text-align:center; font-size:14px; }
    </style>
  </head>
  <body>
    <div id="map"></div>
    <div id="error"></div>
    <script>
      function showError(msg) {
        var el = document.getElementById('error');
        el.style.display = 'block';
        el.textContent = msg;
        window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'error', message: msg }));
      }

      var script = document.createElement('script');
      script.src = 'https://oapi.map.naver.com/openapi/v3/maps.js?ncpClientId=${NAVER_MAP_CLIENT_ID}';
      script.onload = function() {
        try {
          var map = new naver.maps.Map('map', {
            center: new naver.maps.LatLng(${INITIAL_REGION.lat}, ${INITIAL_REGION.lng}),
            zoom: ${INITIAL_REGION.zoom},
            zoomControl: true,
            zoomControlOptions: {
              position: naver.maps.Position.RIGHT_CENTER
            }
          });

          var markers = [];

          window.addMarkers = function(restaurantsJson) {
            markers.forEach(function(m) { m.setMap(null); });
            markers.length = 0;

            var restaurants = JSON.parse(restaurantsJson);
            restaurants.forEach(function(r) {
              var marker = new naver.maps.Marker({
                position: new naver.maps.LatLng(r.lat, r.lng),
                map: map,
                title: r.name
              });

              naver.maps.Event.addListener(marker, 'click', function() {
                window.ReactNativeWebView.postMessage(JSON.stringify({
                  type: 'markerClick',
                  restaurant: r
                }));
              });

              markers.push(marker);
            });
          };

          naver.maps.Event.addListener(map, 'idle', function() {
            var bounds = map.getBounds();
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

          window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'mapReady' }));
        } catch(e) {
          showError('지도 초기화 실패: ' + e.message);
        }
      };
      script.onerror = function() {
        showError('네이버 지도 스크립트 로드 실패\\n(Client ID: ${NAVER_MAP_CLIENT_ID || "없음"})');
      };
      document.head.appendChild(script);
    </script>
  </body>
  </html>
`;

export default function MapScreen() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [mapError, setMapError] = useState<string | null>(null);
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

  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      
      if (data.type === 'markerClick') {
        setSelectedRestaurant(data.restaurant);
      } else if (data.type === 'boundsChanged') {
        fetchRestaurants(data.bounds);
      } else if (data.type === 'mapReady') {
        setLoading(false);
      } else if (data.type === 'error') {
        setMapError(data.message);
        setLoading(false);
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
        originWhitelist={['*']}
        mixedContentMode="always"
        onError={(e) => setMapError(e.nativeEvent.description)}
      />
      
      {loading && !mapError && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#FF6B35" />
        </View>
      )}

      {mapError && (
        <View style={styles.errorOverlay}>
          <Text style={styles.errorText}>지도를 불러올 수 없습니다</Text>
          <Text style={styles.errorDetail}>{mapError}</Text>
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
  errorOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  errorDetail: {
    fontSize: 13,
    color: '#999',
    textAlign: 'center',
  },
});
