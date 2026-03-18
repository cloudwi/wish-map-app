import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useTheme } from '../hooks/useTheme';

interface Section {
  title: string;
  content: string;
}

interface Props {
  title: string;
  effectiveDate: string;
  sections: Section[];
}

export default function LegalDocument({ title, effectiveDate, sections }: Props) {
  const c = useTheme();

  return (
    <ScrollView style={[styles.scroll, { backgroundColor: c.surface }]} showsVerticalScrollIndicator={false}>
      <Text style={[styles.effectiveDate, { color: c.textTertiary }]}>시행일: {effectiveDate}</Text>

      {sections.map((section, index) => (
        <View key={index} style={styles.section}>
          <Text style={[styles.sectionTitle, { color: c.textPrimary }]}>{section.title}</Text>
          <Text style={[styles.sectionContent, { color: c.textSecondary }]}>{section.content}</Text>
        </View>
      ))}

      <View style={{ height: 48 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, paddingHorizontal: 24 },
  effectiveDate: { fontSize: 13, marginTop: 16, marginBottom: 24 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 15, fontWeight: '600', marginBottom: 8 },
  sectionContent: { fontSize: 14, lineHeight: 22 },
});
