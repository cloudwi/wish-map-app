import { create } from 'zustand';

type Coords = { latitude: number; longitude: number };

interface LocationState {
  userLocation: Coords | null;
  lastUpdatedAt: number | null;
  setUserLocation: (coords: Coords) => void;
  clear: () => void;
}

export const useLocationStore = create<LocationState>((set) => ({
  userLocation: null,
  lastUpdatedAt: null,
  setUserLocation: (coords) => set({ userLocation: coords, lastUpdatedAt: Date.now() }),
  clear: () => set({ userLocation: null, lastUpdatedAt: null }),
}));
