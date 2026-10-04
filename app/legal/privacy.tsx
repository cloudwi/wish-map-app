import { Stack } from 'expo-router';
import LegalDocument from '../../components/LegalDocument';

import { PRIVACY_SECTIONS, EFFECTIVE_DATE } from '../../constants/legal-content';

export default function PrivacyScreen() {
  return (
    <>
      <Stack.Screen options={{ title: '개인정보 처리방침' }} />
      <LegalDocument title="개인정보 처리방침" effectiveDate={EFFECTIVE_DATE} sections={PRIVACY_SECTIONS} />
    </>
  );
}
