import React from 'react';
import {
  Dimensions,
  Image,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { colors, radius, spacing } from '../constants/theme';
import { RecommendResult, dishImageUrl } from '../utils/api';
import { ThaiFlashcard } from './ThaiFlashcard';

const { width: W } = Dimensions.get('window');

type Props = {
  result: RecommendResult;
  rank: number;
};

export function DishCard({ result, rank }: Props) {
  const { dish, vendor, explanation } = result;

  const openMaps = () => {
    Linking.openURL(vendor.google_maps_url).catch(() => {
      console.warn('Could not open maps URL');
    });
  };

  return (
    <ScrollView
      style={{ width: W }}
      contentContainerStyle={styles.scroll}
      showsVerticalScrollIndicator={false}
      nestedScrollEnabled
    >
      {/* Dish image with overlay */}
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: dishImageUrl(dish.image_url) }}
          style={styles.image}
          resizeMode="cover"
        />
        {/* Gradient overlay */}
        <View style={styles.imageOverlay} />

        {/* Rank badge on image */}
        {rank === 0 && (
          <View style={styles.bestBadge}>
            <Text style={styles.bestBadgeText}>★ Best Match</Text>
          </View>
        )}
      </View>

      <View style={styles.body}>
        {/* Names */}
        <Text style={styles.englishName}>{dish.english_name}</Text>
        <View style={styles.nameRow}>
          <Text style={styles.thaiName}>{dish.thai_name}</Text>
          <Text style={styles.dotSep}>·</Text>
          <Text style={styles.romanName}>{dish.name}</Text>
        </View>

        {/* Description */}
        <Text style={styles.description}>{dish.description}</Text>

        {/* AI explanation */}
        <View style={styles.explanationBox}>
          <Text style={styles.explanationLabel}>Why this matches you</Text>
          <Text style={styles.explanationText}>{explanation}</Text>
        </View>

        {/* Vendor card */}
        <View style={styles.vendorCard}>
          <View style={styles.vendorIcon}>
            <Text style={styles.vendorIconText}>📍</Text>
          </View>
          <View style={styles.vendorInfo}>
            <Text style={styles.vendorName}>{vendor.vendor_name}</Text>
            <Text style={styles.vendorDistance}>{vendor.distance} away</Text>
          </View>
          <TouchableOpacity
            style={styles.mapsBtn}
            onPress={openMaps}
            activeOpacity={0.8}
          >
            <Text style={styles.mapsBtnText}>Navigate →</Text>
          </TouchableOpacity>
        </View>

        {/* Thai flashcard */}
        <ThaiFlashcard vendor={vendor} />

        <View style={{ height: spacing.xl * 2 }} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    backgroundColor: colors.bg,
  },
  imageContainer: {
    position: 'relative',
  },
  image: {
    width: W,
    height: W * 0.65,
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
  bestBadge: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.md,
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  bestBadgeText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  body: {
    paddingHorizontal: spacing.md + 4,
    paddingTop: spacing.md,
  },
  englishName: {
    fontSize: 28,
    fontWeight: '900',
    color: colors.primary,
    lineHeight: 32,
    letterSpacing: -0.5,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
    marginBottom: spacing.md,
    gap: spacing.xs,
  },
  thaiName: {
    fontSize: 15,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  dotSep: {
    color: colors.textMuted,
    fontSize: 15,
  },
  romanName: {
    fontSize: 15,
    color: colors.textSecondary,
  },
  description: {
    fontSize: 15,
    color: colors.text,
    lineHeight: 23,
    marginBottom: spacing.md,
  },
  explanationBox: {
    backgroundColor: '#FFF8F0',
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 4,
    marginBottom: spacing.md,
  },
  explanationLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: spacing.xs,
  },
  explanationText: {
    fontSize: 14,
    color: '#444',
    lineHeight: 21,
  },
  vendorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
    gap: spacing.sm,
  },
  vendorIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primaryBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vendorIconText: {
    fontSize: 18,
  },
  vendorInfo: {
    flex: 1,
  },
  vendorName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  vendorDistance: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  mapsBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
  },
  mapsBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },
});
