import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radius, spacing } from '../constants/theme';
import { ALL_COUNTRIES, restrictionsForCountry } from '../constants/dietary';
import { store } from '../utils/store';

export default function OnboardingScreen() {
  const [country, setCountry] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [noPork, setNoPork] = useState(false);

  const handleCountrySelect = (c: string) => {
    setCountry(c);
    const auto = restrictionsForCountry(c);
    setNoPork(auto.includes('no_pork'));
    setPickerOpen(false);
  };

  const handleStart = () => {
    const restrictions: string[] = [];
    if (noPork) restrictions.push('no_pork');
    store.setDietaryRestrictions(restrictions);
    router.replace('/swipe');
  };

  const handleSkip = () => {
    store.setDietaryRestrictions([]);
    router.replace('/swipe');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Header */}
        <Text style={styles.title}>One quick question</Text>
        <Text style={styles.subtitle}>
          So we can personalise your recommendations.
        </Text>

        {/* Country picker trigger */}
        <Text style={styles.label}>Where are you from?</Text>
        <TouchableOpacity
          style={styles.picker}
          onPress={() => setPickerOpen(true)}
        >
          <Text style={country ? styles.pickerValue : styles.pickerPlaceholder}>
            {country ?? 'Select your country'}
          </Text>
          <Text style={styles.pickerArrow}>▾</Text>
        </TouchableOpacity>

        {/* Auto-detected restriction badge */}
        {country && restrictionsForCountry(country).includes('no_pork') && (
          <View style={styles.infoBadge}>
            <Text style={styles.infoBadgeText}>
              🚫  Pork dishes will be excluded from your recommendations.
            </Text>
          </View>
        )}

        {/* Manual overrides */}
        <Text style={[styles.label, { marginTop: spacing.lg }]}>
          Dietary preferences
        </Text>

        <View style={styles.toggleRow}>
          <Text style={styles.toggleLabel}>Exclude pork dishes</Text>
          <Switch
            value={noPork}
            onValueChange={setNoPork}
            trackColor={{ true: colors.primary }}
            thumbColor="#fff"
          />
        </View>

        {/* Active filter summary */}
        <Text style={styles.summary}>
          {noPork ? 'Active: No pork' : 'No dietary filters applied'}
        </Text>

        {/* CTA */}
        <TouchableOpacity style={styles.startBtn} onPress={handleStart}>
          <Text style={styles.startBtnText}>Start Swiping  →</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.skipBtn} onPress={handleSkip}>
          <Text style={styles.skipText}>Skip for now</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Country list modal */}
      <Modal visible={pickerOpen} animationType="slide">
        <SafeAreaView style={styles.modalSafe}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select your country</Text>
            <TouchableOpacity onPress={() => setPickerOpen(false)}>
              <Text style={styles.modalClose}>✕</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={['Prefer not to say', ...ALL_COUNTRIES]}
            keyExtractor={(item) => item}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.countryRow,
                  item === country && styles.countryRowSelected,
                ]}
                onPress={() =>
                  item === 'Prefer not to say'
                    ? (setCountry(null), setNoPork(false), setPickerOpen(false))
                    : handleCountrySelect(item)
                }
              >
                <Text
                  style={[
                    styles.countryText,
                    item === country && styles.countryTextSelected,
                  ]}
                >
                  {item}
                </Text>
              </TouchableOpacity>
            )}
          />
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: spacing.lg, paddingBottom: spacing.xl * 2 },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: spacing.xl,
    lineHeight: 22,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  picker: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 4,
    marginBottom: spacing.md,
  },
  pickerValue: { flex: 1, fontSize: 16, color: colors.text },
  pickerPlaceholder: { flex: 1, fontSize: 16, color: colors.textMuted },
  pickerArrow: { fontSize: 14, color: colors.textSecondary },
  infoBadge: {
    backgroundColor: '#FFF0E0',
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
    borderRadius: radius.sm,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  infoBadgeText: { fontSize: 14, color: colors.text, lineHeight: 20 },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  toggleLabel: { flex: 1, fontSize: 15, color: colors.text },
  summary: {
    fontSize: 13,
    color: colors.textMuted,
    marginBottom: spacing.xl,
  },
  startBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    paddingVertical: spacing.md + 2,
    alignItems: 'center',
    marginBottom: spacing.md,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  startBtnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  skipBtn: { alignItems: 'center', paddingVertical: spacing.sm },
  skipText: { color: colors.textMuted, fontSize: 14 },
  // Modal
  modalSafe: { flex: 1, backgroundColor: colors.bg },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: { flex: 1, fontSize: 18, fontWeight: '700', color: colors.text },
  modalClose: { fontSize: 18, color: colors.textSecondary, padding: spacing.xs },
  countryRow: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  countryRowSelected: { backgroundColor: colors.primaryBg },
  countryText: { fontSize: 15, color: colors.text },
  countryTextSelected: { color: colors.primary, fontWeight: '600' },
});
