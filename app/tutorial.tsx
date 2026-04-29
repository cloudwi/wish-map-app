import { router } from 'expo-router';
import { TutorialContent } from '../components/TutorialModal';
import { useAuthStore } from '../stores/authStore';

export default function TutorialScreen() {
  const setTutorialSeen = useAuthStore((s) => s.setTutorialSeen);

  const handleDone = () => {
    setTutorialSeen();
    if (router.canGoBack()) router.back();
    else router.replace('/(tabs)');
  };

  return <TutorialContent onDone={handleDone} />;
}
