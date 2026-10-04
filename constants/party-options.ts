export const PARTY_CATEGORIES = [
  { id: 'MEAL', label: '식사', icon: 'restaurant-outline' },
  { id: 'CAFE', label: '카페', icon: 'cafe-outline' },
  { id: 'BOWLING', label: '볼링', icon: 'bowling-ball-outline' },
  { id: 'SPORTS', label: '운동', icon: 'fitness-outline' },
  { id: 'OTHER', label: '기타', icon: 'sparkles-outline' },
] as const;

export const getPartyCategory = (id: string) =>
  PARTY_CATEGORIES.find((category) => category.id === id) ?? PARTY_CATEGORIES[4];
