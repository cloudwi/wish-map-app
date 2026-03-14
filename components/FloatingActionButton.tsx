import { StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { mediumTap } from '../utils/haptics';
import { useAuthStore } from '../stores/authStore';
import { showInfo } from '../utils/toast';

export default function FloatingActionButton() {
  const { isAuthenticated } = useAuthStore();

  const handlePress = () => {
    mediumTap();
    if (!isAuthenticated) {
      showInfo('로그인 필요', '맛집을 제안하려면 로그인이 필요합니다.');
      router.push('/login');
      return;
    }
    router.push('/(tabs)/suggest');
  };

  return (
    <Animated.View entering={FadeInUp.delay(300).duration(400).springify()} style={styles.container}>
      <TouchableOpacity style={styles.fab} onPress={handlePress} activeOpacity={0.85}>
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    right: 20,
    bottom: 100,
    zIndex: 10,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FF6B35',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
});
