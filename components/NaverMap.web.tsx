// Web - iframe + postMessage 사용
import { useRef, useEffect } from 'react';
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
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // 마커 업데이트
  useEffect(() => {
    if (iframeRef.current?.contentWindow && restaurants.length > 0) {
      iframeRef.current.contentWindow.postMessage(
        { type: 'addMarkers', restaurants },
        '*'
      );
    }
  }, [restaurants]);

  // iframe → parent 메시지 수신
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (!e.data?.type) return;
      if (e.data.type === 'markerClick') onMarkerClick(e.data.restaurant);
      else if (e.data.type === 'boundsChanged') onBoundsChange(e.data.bounds);
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [onMarkerClick, onBoundsChange]);

  const mapHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
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

        function addMarkers(list) {
          markers.forEach(m => m.setMap(null));
          markers.length = 0;
          list.forEach(r => {
            const marker = new naver.maps.Marker({
              position: new naver.maps.LatLng(r.lat, r.lng),
              map, title: r.name
            });
            naver.maps.Event.addListener(marker, 'click', () => {
              window.parent.postMessage({ type: 'markerClick', restaurant: r }, '*');
            });
            markers.push(marker);
          });
        }

        naver.maps.Event.addListener(map, 'idle', () => {
          const b = map.getBounds();
          window.parent.postMessage({
            type: 'boundsChanged',
            bounds: { minLat: b.getSW().lat(), maxLat: b.getNE().lat(), minLng: b.getSW().lng(), maxLng: b.getNE().lng() }
          }, '*');
        });

        // parent → iframe 메시지 수신
        window.addEventListener('message', (e) => {
          if (e.data?.type === 'addMarkers') addMarkers(e.data.restaurants);
        });
      </script>
    </body>
    </html>
  `;

  return (
    <iframe
      ref={iframeRef}
      srcDoc={mapHTML}
      style={{ width: '100%', height: '100%', border: 'none' }}
      title="Naver Map"
    />
  );
}
