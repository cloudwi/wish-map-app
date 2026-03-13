import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  icon?: keyof typeof Ionicons.glyphMap;
  message?: string;
}

export function AuthRequired({
  icon = 'person-circle-outline',
  message = '로그인하고 더 많은 기능을 이용해보세요!',
}: Props) {
  return (
    <View style={styles.container}>
      <Ionicons name={icon} size={72} color="#ddd" />
      <Text style={styles.title}>로그인이 필요합니다</Text>
      <Text style={styles.message}>{message}</Text>
      <TouchableOpacity style={styles.button} onPress={() => router.push('/login')}>
        <Text style={styles.buttonText}>로그인하기</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginTop: 20,
    marginBottom: 10,
  },
  message: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 30,
  },
  button: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 40,
    paddingVertical: 14,
    borderRadius: 25,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
