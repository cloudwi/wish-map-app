import {
  StyleSheet, View, Text, TouchableOpacity,
  Image, ActivityIndicator, Platform,
} from 'react-native';
import { useState, useEffect } from 'react';
import { router, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as AppleAuthentication from 'expo-apple-authentication';
import { login as kakaoLogin } from '@react-native-seoul/kakao-login';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import NaverLogin from '@react-native-seoul/naver-login';
import { useAuthStore } from '../stores/authStore';
import { useTheme } from '../hooks/useTheme';
import { AuthProvider } from '../types';
import { showError } from '../utils/toast';
import { TermsAgreementModal } from '../components/TermsAgreementModal';

const GOOGLE_IOS_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || '';
const GOOGLE_WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '';
const NAVER_CONSUMER_KEY = process.env.EXPO_PUBLIC_NAVER_CONSUMER_KEY || '';
const NAVER_CONSUMER_SECRET = process.env.EXPO_PUBLIC_NAVER_CONSUMER_SECRET || '';

GoogleSignin.configure({
  iosClientId: GOOGLE_IOS_CLIENT_ID,
  webClientId: GOOGLE_WEB_CLIENT_ID,
  scopes: ['profile', 'email'],
});

export default function LoginScreen() {
  const c = useTheme();
  const { login, hasAgreedToTerms, setTermsAgreed, logout } = useAuthStore();
  const [loading, setLoading] = useState<AuthProvider | null>(null);
  const [showTerms, setShowTerms] = useState(false);

  useEffect(() => {
    NaverLogin.initialize({
      appName: '위시맵',
      consumerKey: NAVER_CONSUMER_KEY,
      consumerSecret: NAVER_CONSUMER_SECRET,
      serviceUrlSchemeIOS: 'wishmap',
      disableNaverAppAuthIOS: false,
    });
  }, []);

  const navigateAfterLogin = () => {
    const { hasAgreedToTerms } = useAuthStore.getState();
    if (hasAgreedToTerms) {
      router.replace('/(tabs)');
    } else {
      setShowTerms(true);
    }
  };

  const handleTermsAgree = () => {
    setTermsAgreed();
    setShowTerms(false);
    router.replace('/(tabs)');
  };

  const handleTermsCancel = async () => {
    setShowTerms(false);
    await logout();
  };

  const handleKakao = async () => {
    try {
      setLoading('KAKAO');
      const result = await kakaoLogin();
      await login('KAKAO', result.accessToken);
      navigateAfterLogin();
    } catch (e: any) {
      if (e.code !== 'E_CANCELLED_OPERATION') {
        showError('로그인 실패', e.message || '카카오 로그인 중 오류가 발생했습니다.');
      }
    } finally {
      setLoading(null);
    }
  };

  const handleGoogle = async () => {
    try {
      setLoading('GOOGLE');
      await GoogleSignin.hasPlayServices();
      const response = await GoogleSignin.signIn();
      const idToken = response.data?.idToken;
      if (!idToken) throw new Error('구글 토큰 발급 실패');
      await login('GOOGLE', idToken);
      navigateAfterLogin();
    } catch (e: any) {
      if (e.code !== 'SIGN_IN_CANCELLED') {
        showError('로그인 실패', e.message || '구글 로그인 중 오류가 발생했습니다.');
      }
    } finally {
      setLoading(null);
    }
  };

  const handleNaver = async () => {
    try {
      setLoading('NAVER');
      const result = await NaverLogin.login();
      if (!result.isSuccess || !result.successResponse) {
        throw new Error('네이버 로그인에 실패했습니다.');
      }
      await login('NAVER', result.successResponse.accessToken);
      navigateAfterLogin();
    } catch (e: any) {
      showError('로그인 실패', e.message || '네이버 로그인 중 오류가 발생했습니다.');
    } finally {
      setLoading(null);
    }
  };

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
      navigateAfterLogin();
    } catch (e: any) {
      if (e.code !== 'ERR_REQUEST_CANCELED') {
        showError('로그인 실패', e.message || 'Apple 로그인 중 오류가 발생했습니다.');
      }
    } finally {
      setLoading(null);
    }
  };

  const isDisabled = loading !== null;

  return (
    <>
      <TermsAgreementModal
        visible={showTerms}
        onAgree={handleTermsAgree}
        onCancel={handleTermsCancel}
      />
      <Stack.Screen
        options={{
          title: '로그인',
          headerStyle: { backgroundColor: c.headerBg },
          headerTintColor: c.textPrimary,
          headerShadowVisible: false,
        }}
      />

      <View style={[styles.container, { backgroundColor: c.surface }]}>
        {/* 로고 */}
        <View style={styles.logoContainer}>
          <Image
            source={require('../assets/images/logo.png')}
            style={styles.logoImage}
          />
          <Text style={[styles.appName, { color: c.primary }]}>위시맵</Text>
          <Text style={[styles.tagline, { color: c.textSecondary }]}>우리 동네 장소 지도</Text>
        </View>

        {/* 소셜 로그인 버튼 */}
        <View style={styles.buttonContainer}>
          {/* 카카오 */}
          <TouchableOpacity
            style={[styles.socialButton, styles.kakaoButton, isDisabled && loading !== 'KAKAO' && styles.dimmed]}
            onPress={handleKakao}
            disabled={isDisabled}
            activeOpacity={0.85}
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
            style={[styles.socialButton, styles.googleButton, { borderColor: c.border }, isDisabled && loading !== 'GOOGLE' && styles.dimmed]}
            onPress={handleGoogle}
            disabled={isDisabled}
            activeOpacity={0.85}
          >
            {loading === 'GOOGLE' ? (
              <ActivityIndicator color={c.textSecondary} />
            ) : (
              <>
                <Ionicons name="logo-google" size={20} color="#DB4437" />
                <Text style={[styles.googleButtonText, { color: c.textSecondary }]}>Google로 시작하기</Text>
              </>
            )}
          </TouchableOpacity>

          {/* 네이버 */}
          <TouchableOpacity
            style={[styles.socialButton, styles.naverButton, isDisabled && loading !== 'NAVER' && styles.dimmed]}
            onPress={handleNaver}
            disabled={isDisabled}
            activeOpacity={0.85}
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
              cornerRadius={8}
              style={[styles.appleButton, isDisabled && styles.dimmed]}
              onPress={handleApple}
            />
          )}
        </View>

        {/* 건너뛰기 */}
        <View>
          <TouchableOpacity style={styles.skipButton} onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)')}>
            <Text style={[styles.skipButtonText, { color: c.textSecondary }]}>로그인 없이 둘러보기</Text>
          </TouchableOpacity>
        </View>

        {/* 약관 */}
        <Text style={[styles.terms, { color: c.textTertiary }]}>
          로그인 시 <Text style={{ color: c.primary }}>이용약관</Text> 및{' '}
          <Text style={{ color: c.primary }}>개인정보처리방침</Text>에 동의하게 됩니다.
        </Text>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 30 },
  logoContainer: { alignItems: 'center', marginTop: 40, marginBottom: 50 },
  logoImage: {
    width: 80, height: 80, borderRadius: 16, marginBottom: 16,
  },
  appName: { fontSize: 24, fontWeight: '600', marginBottom: 8 },
  tagline: { fontSize: 16 },
  buttonContainer: { gap: 12 },
  socialButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 14, borderRadius: 8, gap: 10,
  },
  socialIcon: { width: 20, height: 20 },
  dimmed: { opacity: 0.5 },
  kakaoButton: { backgroundColor: '#FEE500' },
  kakaoButtonText: { fontSize: 16, fontWeight: '600', color: '#000' },
  googleButton: { backgroundColor: 'transparent', borderWidth: 1 },
  googleButtonText: { fontSize: 16, fontWeight: '600' },
  naverButton: { backgroundColor: '#03C75A' },
  naverIcon: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
  naverButtonText: { fontSize: 16, fontWeight: '600', color: '#fff' },
  appleButton: { width: '100%', height: 50 },
  skipButton: { marginTop: 20, alignItems: 'center', paddingVertical: 10 },
  skipButtonText: { fontSize: 14 },
  terms: {
    position: 'absolute', bottom: 40, left: 30, right: 30,
    textAlign: 'center', fontSize: 12, lineHeight: 18,
  },
});
