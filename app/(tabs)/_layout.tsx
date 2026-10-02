import { Tabs, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../stores/authStore';
import { useTheme } from '../../hooks/useTheme';
import { TermsAgreementModal } from '../../components/TermsAgreementModal';

export default function TabLayout() {
  const { isAuthenticated, isLoading, hasAgreedToTerms, isCheckingTerms, setTermsAgreed, logout } =
    useAuthStore();
  const c = useTheme();
  const showTerms = isAuthenticated && !isLoading && !isCheckingTerms && !hasAgreedToTerms;

  const handleTermsCancel = async () => {
    await logout();
    router.replace('/login');
  };

  return (
    <>
      <TermsAgreementModal visible={showTerms} onAgree={setTermsAgreed} onCancel={handleTermsCancel} />
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
