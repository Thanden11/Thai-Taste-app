import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { radius, spacing } from '../constants/theme';
import { VendorOut } from '../utils/api';

type Props = {
  vendor: VendorOut;
};

export function ThaiFlashcard({ vendor }: Props) {
  const [flipped, setFlipped] = useState(false);

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => setFlipped(!flipped)}
      activeOpacity={0.9}
    >
      <Text style={styles.label}>🇹🇭 SAY IT IN THAI</Text>
      <Text style={styles.thai}>{vendor.flashcard_thai}</Text>
      <Text style={styles.phonetic}>{vendor.flashcard_phonetic}</Text>
      <View style={styles.divider} />
      <Text style={styles.hint}>
        {flipped
          ? 'Show this to the vendor when ordering!'
          : 'Tap to see ordering tip'}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md + 4,
    alignItems: 'center',
    backgroundColor: '#E85D04',
    shadowColor: '#E85D04',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  label: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 2,
    marginBottom: spacing.sm,
  },
  thai: {
    color: '#fff',
    fontSize: 30,
    fontWeight: '900',
    marginBottom: spacing.xs,
  },
  phonetic: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 16,
    fontStyle: 'italic',
    fontWeight: '500',
  },
  divider: {
    width: 40,
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 1,
    marginVertical: spacing.sm,
  },
  hint: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    fontWeight: '600',
  },
});
