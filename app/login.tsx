import { StyleSheet, View, Text, TouchableOpacity, Image, ActivityIndicator, Alert } from 'react-native';
import { useState } from 'react';
import { router, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import { useAuthStore } from '../stores/authStore';
import { AuthProvider } from '../types';

WebBrowser.maybeCompleteAuthSession();

// OAuth 설정 (실제 값으로 교체 필요)
const KAKAO_CLIENT_ID = process.env.EXPO_PUBLIC_KAKAO_CLIENT_ID || 'YOUR_KAKAO_CLIENT_ID';
const GOOGLE_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID';
const NAVER_CLIENT_ID = process.env.EXPO_PUBLIC_NAVER_CLIENT_ID || 'YOUR_NAVER_CLIENT_ID';

export default function LoginScreen() {
  const { login } = useAuthStore();
  const [loading, setLoading] = useState<AuthProvider | null>(null);

  const handleSocialLogin = async (provider: AuthProvider) => {
    try {
      setLoading(provider);
      
      // TODO: 각 플랫폼별 OAuth 구현
      // 여기서는 예시로 Alert만 표시
      Alert.alert(
        '개발 중',
        `${provider} 로그인은 현재 개발 중입니다.\n\nOAuth 키 설정 후 사용 가능합니다.`,
        [{ text: '확인' }]
      );
      
      // 실제 구현 예시 (카카오):
      // const authUrl = `https://kauth.kakao.com/oauth/authorize?client_id=${KAKAO_CLIENT_ID}&redirect_uri=${redirectUri}&response_type=code`;
      // const result = await AuthSession.startAsync({ authUrl });
      // if (result.type === 'success') {
      //   const accessToken = await exchangeCodeForToken(result.params.code);
      //   await login(provider, accessToken);
      //   router.back();
      // }

    } catch (error: any) {
      Alert.alert('로그인 실패', error.message || '로그인 중 오류가 발생했습니다.');
    } finally {
      setLoading(null);
    }
  };

  return (
    <>
      <Stack.Screen 
        options={{
          title: '로그인',
          headerStyle: { backgroundColor: '#FF6B35' },
          headerTintColor: '#fff',
        }}
      />
      
      <View style={styles.container}>
        {/* 로고 */}
        <View style={styles.logoContainer}>
          <View style={styles.logoPlaceholder}>
            <Ionicons name="map" size={60} color="#FF6B35" />
          </View>
          <Text style={styles.appName}>위시맵</Text>
          <Text style={styles.tagline}>우리 동네 맛집 지도</Text>
        </View>

        {/* 소셜 로그인 버튼들 */}
        <View style={styles.buttonContainer}>
          {/* 카카오 */}
          <TouchableOpacity
            style={[styles.socialButton, styles.kakaoButton]}
            onPress={() => handleSocialLogin('KAKAO')}
            disabled={loading !== null}
          >
            {loading === 'KAKAO' ? (
              <ActivityIndicator color="#000" />
            ) : (
              <>
                <Image 
                  source={{ uri: 'https://developers.kakao.com/assets/img/about/logos/kakaolink/kakaolink_btn_small.png' }}
                  style={styles.socialIcon}
                />
                <Text style={styles.kakaoButtonText}>카카오로 시작하기</Text>
              </>
            )}
          </TouchableOpacity>

          {/* 구글 */}
          <TouchableOpacity
            style={[styles.socialButton, styles.googleButton]}
            onPress={() => handleSocialLogin('GOOGLE')}
            disabled={loading !== null}
          >
            {loading === 'GOOGLE' ? (
              <ActivityIndicator color="#666" />
            ) : (
              <>
                <Ionicons name="logo-google" size={20} color="#DB4437" />
                <Text style={styles.googleButtonText}>Google로 시작하기</Text>
              </>
            )}
          </TouchableOpacity>

          {/* 네이버 */}
          <TouchableOpacity
            style={[styles.socialButton, styles.naverButton]}
            onPress={() => handleSocialLogin('NAVER')}
            disabled={loading !== null}
          >
            {loading === 'NAVER' ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Text style={styles.naverIcon}>N</Text>
                <Text style={styles.naverButtonText}>네이버로 시작하기</Text>
              </>
            )}
          </TouchableOpacity>

          {/* 애플 */}
          <TouchableOpacity
            style={[styles.socialButton, styles.appleButton]}
            onPress={() => handleSocialLogin('APPLE')}
            disabled={loading !== null}
          >
            {loading === 'APPLE' ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="logo-apple" size={22} color="#fff" />
                <Text style={styles.appleButtonText}>Apple로 시작하기</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* 건너뛰기 */}
        <TouchableOpacity 
          style={styles.skipButton}
          onPress={() => router.back()}
        >
          <Text style={styles.skipButtonText}>로그인 없이 둘러보기</Text>
        </TouchableOpacity>

        {/* 약관 안내 */}
        <Text style={styles.terms}>
          로그인 시 <Text style={styles.link}>이용약관</Text> 및{' '}
          <Text style={styles.link}>개인정보처리방침</Text>에 동의하게 됩니다.
        </Text>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 30,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 50,
  },
  logoPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 25,
    backgroundColor: '#FFF5F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  appName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FF6B35',
    marginBottom: 8,
  },
  tagline: {
    fontSize: 16,
    color: '#888',
  },
  buttonContainer: {
    gap: 12,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 10,
  },
  socialIcon: {
    width: 20,
    height: 20,
  },
  kakaoButton: {
    backgroundColor: '#FEE500',
  },
  kakaoButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  googleButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  googleButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  naverButton: {
    backgroundColor: '#03C75A',
  },
  naverIcon: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  naverButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  appleButton: {
    backgroundColor: '#000',
  },
  appleButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  skipButton: {
    marginTop: 20,
    alignItems: 'center',
    paddingVertical: 10,
  },
  skipButtonText: {
    fontSize: 14,
    color: '#888',
  },
  terms: {
    position: 'absolute',
    bottom: 40,
    left: 30,
    right: 30,
    textAlign: 'center',
    fontSize: 12,
    color: '#aaa',
    lineHeight: 18,
  },
  link: {
    color: '#FF6B35',
  },
});
