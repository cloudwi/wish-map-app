import {
  StyleSheet, View, Text, TouchableOpacity,
  Image, ActivityIndicator, Alert, Platform,
} from 'react-native';
import { useState } from 'react';
import { router, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import * as Google from 'expo-auth-session/providers/google';
import * as AppleAuthentication from 'expo-apple-authentication';
import { useAuthStore } from '../stores/authStore';
import { AuthProvider } from '../types';

WebBrowser.maybeCompleteAuthSession();

const KAKAO_CLIENT_ID  = process.env.EXPO_PUBLIC_KAKAO_CLIENT_ID  || '';
const GOOGLE_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID || '';
const NAVER_CLIENT_ID  = process.env.EXPO_PUBLIC_NAVER_CLIENT_ID  || '';
const NAVER_CLIENT_SECRET = process.env.EXPO_PUBLIC_NAVER_CLIENT_SECRET || '';

// ──────────────────────────────────────────────
// Google (implicit flow – access_token 즉시 획득)
// ──────────────────────────────────────────────
function useGoogleAuth() {
  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: GOOGLE_CLIENT_ID,
    scopes: ['openid', 'profile', 'email'],
  });
  return { request, response, promptAsync };
}

export default function LoginScreen() {
  const { login } = useAuthStore();
  const [loading, setLoading] = useState<AuthProvider | null>(null);

  const { promptAsync: googlePrompt, response: googleResponse } = useGoogleAuth();

  // ── 카카오 ──────────────────────────────────
  const handleKakao = async () => {
    try {
      setLoading('KAKAO');
      const redirectUri = AuthSession.makeRedirectUri({ scheme: 'wishmap', path: 'oauth' });

      const result = await AuthSession.startAsync({
        authUrl:
          `https://kauth.kakao.com/oauth/authorize` +
          `?client_id=${KAKAO_CLIENT_ID}` +
          `&redirect_uri=${encodeURIComponent(redirectUri)}` +
          `&response_type=token`,
      });

      if (result.type === 'success' && result.params?.access_token) {
        await login('KAKAO', result.params.access_token);
        router.replace('/(tabs)');
      } else if (result.type !== 'cancel') {
        throw new Error('카카오 로그인에 실패했습니다.');
      }
    } catch (e: any) {
      Alert.alert('로그인 실패', e.message || '카카오 로그인 중 오류가 발생했습니다.');
    } finally {
      setLoading(null);
    }
  };

  // ── 구글 ────────────────────────────────────
  const handleGoogle = async () => {
    try {
      setLoading('GOOGLE');
      const result = await googlePrompt();

      if (result.type === 'success' && result.authentication?.accessToken) {
        await login('GOOGLE', result.authentication.accessToken);
        router.replace('/(tabs)');
      } else if (result.type !== 'cancel') {
        throw new Error('구글 로그인에 실패했습니다.');
      }
    } catch (e: any) {
      Alert.alert('로그인 실패', e.message || '구글 로그인 중 오류가 발생했습니다.');
    } finally {
      setLoading(null);
    }
  };

  // ── 네이버 ──────────────────────────────────
  const handleNaver = async () => {
    try {
      setLoading('NAVER');
      const redirectUri = AuthSession.makeRedirectUri({ scheme: 'wishmap', path: 'oauth' });
      const state = Math.random().toString(36).substring(2);

      const result = await AuthSession.startAsync({
        authUrl:
          `https://nid.naver.com/oauth2.0/authorize` +
          `?client_id=${NAVER_CLIENT_ID}` +
          `&redirect_uri=${encodeURIComponent(redirectUri)}` +
          `&response_type=code` +
          `&state=${state}`,
      });

      if (result.type === 'success' && result.params?.code) {
        // code → access_token (네이버 CORS 제한 없음 – native fetch)
        const tokenRes = await fetch('https://nid.naver.com/oauth2.0/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            grant_type: 'authorization_code',
            client_id: NAVER_CLIENT_ID,
            client_secret: NAVER_CLIENT_SECRET,
            code: result.params.code,
            state: result.params.state || state,
          }).toString(),
        });
        const tokenData = await tokenRes.json();

        if (!tokenData.access_token) throw new Error('네이버 토큰 발급 실패');
        await login('NAVER', tokenData.access_token);
        router.replace('/(tabs)');
      } else if (result.type !== 'cancel') {
        throw new Error('네이버 로그인에 실패했습니다.');
      }
    } catch (e: any) {
      Alert.alert('로그인 실패', e.message || '네이버 로그인 중 오류가 발생했습니다.');
    } finally {
      setLoading(null);
    }
  };

  // ── 애플 (iOS 전용) ─────────────────────────
  const handleApple = async () => {
    try {
      setLoading('APPLE');
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      if (!credential.identityToken) throw new Error('Apple identity token 없음');
      await login('APPLE', credential.identityToken);
      router.replace('/(tabs)');
    } catch (e: any) {
      if (e.code !== 'ERR_REQUEST_CANCELED') {
        Alert.alert('로그인 실패', e.message || 'Apple 로그인 중 오류가 발생했습니다.');
      }
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

        {/* 소셜 로그인 버튼 */}
        <View style={styles.buttonContainer}>
          {/* 카카오 */}
          <TouchableOpacity
            style={[styles.socialButton, styles.kakaoButton]}
            onPress={handleKakao}
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
            onPress={handleGoogle}
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
            onPress={handleNaver}
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

          {/* 애플 (iOS만) */}
          {Platform.OS === 'ios' && (
            <AppleAuthentication.AppleAuthenticationButton
              buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
              buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
              cornerRadius={12}
              style={styles.appleButton}
              onPress={handleApple}
            />
          )}
        </View>

        {/* 건너뛰기 */}
        <TouchableOpacity style={styles.skipButton} onPress={() => router.back()}>
          <Text style={styles.skipButtonText}>로그인 없이 둘러보기</Text>
        </TouchableOpacity>

        {/* 약관 */}
        <Text style={styles.terms}>
          로그인 시 <Text style={styles.link}>이용약관</Text> 및{' '}
          <Text style={styles.link}>개인정보처리방침</Text>에 동의하게 됩니다.
        </Text>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 30 },
  logoContainer: { alignItems: 'center', marginTop: 40, marginBottom: 50 },
  logoPlaceholder: {
    width: 100, height: 100, borderRadius: 25,
    backgroundColor: '#FFF5F0', justifyContent: 'center', alignItems: 'center', marginBottom: 16,
  },
  appName: { fontSize: 28, fontWeight: 'bold', color: '#FF6B35', marginBottom: 8 },
  tagline: { fontSize: 16, color: '#888' },
  buttonContainer: { gap: 12 },
  socialButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 14, borderRadius: 12, gap: 10,
  },
  socialIcon: { width: 20, height: 20 },
  kakaoButton: { backgroundColor: '#FEE500' },
  kakaoButtonText: { fontSize: 16, fontWeight: '600', color: '#000' },
  googleButton: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#ddd' },
  googleButtonText: { fontSize: 16, fontWeight: '600', color: '#666' },
  naverButton: { backgroundColor: '#03C75A' },
  naverIcon: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
  naverButtonText: { fontSize: 16, fontWeight: '600', color: '#fff' },
  appleButton: { width: '100%', height: 50 },
  skipButton: { marginTop: 20, alignItems: 'center', paddingVertical: 10 },
  skipButtonText: { fontSize: 14, color: '#888' },
  terms: {
    position: 'absolute', bottom: 40, left: 30, right: 30,
    textAlign: 'center', fontSize: 12, color: '#aaa', lineHeight: 18,
  },
  link: { color: '#FF6B35' },
});
