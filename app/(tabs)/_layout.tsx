import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';

export default function TabLayout() {
  const c = useTheme();

  return (
    <>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: c.primary,
          tabBarInactiveTintColor: c.textSecondary,
          tabBarStyle: { backgroundColor: c.surface, borderTopColor: c.border },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: '파티',
            tabBarIcon: ({ color }) => <Ionicons name="people-outline" size={22} color={color} />,
          }}
        />
        <Tabs.Screen
          name="mypage"
          options={{
            title: '마이',
            tabBarIcon: ({ color }) => <Ionicons name="person-outline" size={22} color={color} />,
          }}
        />
      </Tabs>
    </>
  );
}
