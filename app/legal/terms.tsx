import { Stack } from 'expo-router';
import LegalDocument from '../../components/LegalDocument';

import { TERMS_SECTIONS, EFFECTIVE_DATE } from '../../constants/legal-content';

export default function TermsScreen() {
  return (
    <>
      <Stack.Screen options={{ title: '이용약관' }} />
      <LegalDocument title="이용약관" effectiveDate={EFFECTIVE_DATE} sections={TERMS_SECTIONS} />
    </>
  );
}
