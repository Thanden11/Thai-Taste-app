import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { radius, spacing } from '../constants/theme';
import { VendorOut } from '../utils/api';

type Props = {
  vendor: VendorOut;
};

export function ThaiFlashcard({ vendor }: Props) {
  return (
    <View style={styles.card}>
      <Text style={styles.label}>SAY IT IN THAI</Text>
      <Text style={styles.thai}>{vendor.flashcard_thai}</Text>
      <Text style={styles.phonetic}>{vendor.flashcard_phonetic}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
    // gradient approximated with a solid orange; use expo-linear-gradient for real gradient
    backgroundColor: '#E85D04',
  },
  label: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginBottom: spacing.xs,
  },
  thai: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '800',
    marginBottom: spacing.xs,
  },
  phonetic: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 15,
    fontStyle: 'italic',
  },
});
