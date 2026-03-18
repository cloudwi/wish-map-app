import { apiClient } from './client';

export interface Category {
  id: number;
  name: string;
  priority: number;
}

export const categoryApi = {
  getCategories: async (): Promise<Category[]> => {
    const { data } = await apiClient.get<Category[]>('/categories');
    return data;
  },
};
