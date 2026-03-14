import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

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
  return (
    <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
      <Text style={styles.effectiveDate}>시행일: {effectiveDate}</Text>

      {sections.map((section, index) => (
        <View key={index} style={styles.section}>
          <Text style={styles.sectionTitle}>{section.title}</Text>
          <Text style={styles.sectionContent}>{section.content}</Text>
        </View>
      ))}

      <View style={{ height: 48 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, paddingHorizontal: 24 },
  effectiveDate: { fontSize: 13, color: '#999', marginTop: 16, marginBottom: 24 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 15, fontWeight: '600', color: '#333', marginBottom: 8 },
  sectionContent: { fontSize: 14, lineHeight: 22, color: '#666' },
});
