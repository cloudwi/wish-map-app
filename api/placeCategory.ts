import { apiClient } from './client';
import { PlaceCategory } from '../types';

export const placeCategoryApi = {
  getPlaceCategories: async (): Promise<PlaceCategory[]> => {
    const { data } = await apiClient.get<PlaceCategory[]>('/place-categories');
    return data;
  },
};
