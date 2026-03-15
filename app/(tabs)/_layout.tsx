import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Tabs, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../stores/authStore';
import { useEffect } from 'react';
import Animated, { useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { lightTap } from '../../utils/haptics';
import { useTheme } from '../../hooks/useTheme';

function AnimatedTabIcon({ name, color, size, focused }: {
  name: keyof typeof Ionicons.glyphMap;
  color: string;
  size: number;
  focused: boolean;
}) {
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withSpring(focused ? 1.15 : 1, { damping: 15, stiffness: 200 }) }],
  }));

  return (
    <Animated.View style={animatedStyle}>
      <Ionicons name={name} size={size} color={color} />
    </Animated.View>
  );
}

function HeaderRight() {
  const c = useTheme();
  return (
    <View style={styles.headerRight}>
      <TouchableOpacity
        style={styles.headerIconBtn}
        onPress={() => { lightTap(); router.push('/notifications'); }}
      >
        <Ionicons name="notifications-outline" size={26} color={c.textPrimary} />
        <View style={[styles.badge, { borderColor: c.headerBg }]} />
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.headerIconBtn}
        onPress={() => { lightTap(); /* TODO: friends */ }}
      >
        <Ionicons name="people-outline" size={26} color={c.textPrimary} />
      </TouchableOpacity>
    </View>
  );
}

function HeaderTitle() {
  const c = useTheme();
  return (
    <View style={styles.headerTitleWrap}>
      <Ionicons name="map" size={22} color={c.primary} />
      <Text style={[styles.headerTitleText, { color: c.textPrimary }]}>위시맵</Text>
    </View>
  );
}

export default function TabLayout() {
  const { checkAuth } = useAuthStore();
  const c = useTheme();

  useEffect(() => {
    checkAuth();
  }, []);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: c.primary,
        tabBarInactiveTintColor: c.textTertiary,
        tabBarStyle: {
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: c.tabBarBg,
          borderTopWidth: 0,
          elevation: 0,
          height: 85,
          paddingBottom: 30,
          paddingTop: 8,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        headerStyle: { backgroundColor: c.headerBg },
        headerShadowVisible: false,
        headerTintColor: c.textPrimary,
        headerTitleStyle: { fontWeight: '700' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: '지도',
          headerTitle: () => <HeaderTitle />,
          headerRight: () => <HeaderRight />,
          tabBarIcon: ({ color, size, focused }) => (
            <AnimatedTabIcon name="map" color={color} size={size} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="list"
        options={{
          title: '맛집',
          headerTitle: () => <HeaderTitle />,
          headerRight: () => <HeaderRight />,
          tabBarIcon: ({ color, size, focused }) => (
            <AnimatedTabIcon name="compass-outline" color={color} size={size} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="suggest"
        options={{ href: null }}
      />
      <Tabs.Screen
        name="mypage"
        options={{
          title: 'MY',
          headerTitle: '마이페이지',
          headerTitleStyle: { fontWeight: '700', fontSize: 17, color: c.textPrimary },
          tabBarIcon: ({ color, size, focused }) => (
            <AnimatedTabIcon name="person" color={color} size={size} focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginRight: 4,
  },
  headerIconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#FF6B35',
    borderWidth: 1.5,
  },
  headerTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerTitleText: {
    fontSize: 20,
    fontWeight: '800',
  },
});
