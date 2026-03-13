// Native (iOS/Android) - WebView 사용
import { useRef, useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';
import { Restaurant, MapBounds } from '../types';

const NAVER_MAP_CLIENT_ID = process.env.EXPO_PUBLIC_NAVER_MAP_CLIENT_ID || '';

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
  const webViewRef = useRef<WebView>(null);

  useEffect(() => {
    if (webViewRef.current && restaurants.length > 0) {
      const script = `window.addMarkers('${JSON.stringify(restaurants).replace(/'/g, "\\'")}');`;
      webViewRef.current.injectJavaScript(script);
    }
  }, [restaurants]);

  const mapHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
      <style>* { margin: 0; padding: 0; } html, body, #map { width: 100%; height: 100%; }</style>
      <script src="https://oapi.map.naver.com/openapi/v3/maps.js?ncpClientId=${NAVER_MAP_CLIENT_ID}"></script>
    </head>
    <body>
      <div id="map"></div>
      <script>
        const map = new naver.maps.Map('map', {
          center: new naver.maps.LatLng(${initialLat}, ${initialLng}),
          zoom: ${initialZoom},
          zoomControl: true,
          zoomControlOptions: { position: naver.maps.Position.RIGHT_CENTER }
        });
        const markers = [];

        window.addMarkers = function(json) {
          markers.forEach(m => m.setMap(null));
          markers.length = 0;
          JSON.parse(json).forEach(r => {
            const marker = new naver.maps.Marker({
              position: new naver.maps.LatLng(r.lat, r.lng),
              map, title: r.name
            });
            naver.maps.Event.addListener(marker, 'click', () => {
              window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'markerClick', restaurant: r }));
            });
            markers.push(marker);
          });
        };

        naver.maps.Event.addListener(map, 'idle', () => {
          const b = map.getBounds();
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'boundsChanged',
            bounds: { minLat: b.getSW().lat(), maxLat: b.getNE().lat(), minLng: b.getSW().lng(), maxLng: b.getNE().lng() }
          }));
        });
      </script>
    </body>
    </html>
  `;

  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'markerClick') onMarkerClick(data.restaurant);
      else if (data.type === 'boundsChanged') onBoundsChange(data.bounds);
    } catch {}
  };

  return (
    <WebView
      ref={webViewRef}
      source={{ html: mapHTML }}
      style={StyleSheet.absoluteFill}
      onMessage={handleMessage}
      javaScriptEnabled
    />
  );
}
