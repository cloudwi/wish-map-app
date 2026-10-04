import { Linking, Platform } from 'react-native';

interface Venue {
  venueName: string;
  venueAddress: string;
  latitude: number;
  longitude: number;
}

export async function openVenueMap(venue: Venue): Promise<void> {
  const webUrl = `https://map.naver.com/p/search/${encodeURIComponent(`${venue.venueName} ${venue.venueAddress}`)}`;
  if (Platform.OS === 'web') {
    await Linking.openURL(webUrl);
    return;
  }
  const appName = Platform.OS === 'ios' ? 'com.wishmap.app' : 'kr.wishmap.app';
  const appUrl = `nmap://place?lat=${venue.latitude}&lng=${venue.longitude}&name=${encodeURIComponent(venue.venueName)}&appname=${appName}`;
  try {
    await Linking.openURL(appUrl);
  } catch {
    await Linking.openURL(webUrl);
  }
}
