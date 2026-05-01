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
      {/* Dish image */}
      <Image
        source={{ uri: dishImageUrl(dish.image_url) }}
        style={styles.image}
        resizeMode="cover"
      />

      <View style={styles.body}>
        {/* Rank badge */}
        {rank === 0 && (
          <View style={styles.rankBadge}>
            <Text style={styles.rankText}>Best Match</Text>
          </View>
        )}

        {/* Names */}
        <Text style={styles.englishName}>{dish.english_name}</Text>
        <Text style={styles.thaiName}>{dish.thai_name}  ·  {dish.name}</Text>

        {/* Description */}
        <Text style={styles.description}>{dish.description}</Text>

        {/* LLM explanation */}
        <View style={styles.explanationBox}>
          <Text style={styles.explanationText}>"{explanation}"</Text>
        </View>

        {/* Vendor */}
        <View style={styles.vendorCard}>
          <View style={styles.vendorInfo}>
            <Text style={styles.vendorName}>{vendor.vendor_name}</Text>
            <Text style={styles.vendorDistance}>{vendor.distance} away</Text>
          </View>
          <TouchableOpacity style={styles.mapsBtn} onPress={openMaps}>
            <Text style={styles.mapsBtnText}>Navigate</Text>
          </TouchableOpacity>
        </View>

        {/* Thai flashcard */}
        <ThaiFlashcard vendor={vendor} />

        <View style={{ height: spacing.xl }} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    backgroundColor: colors.bg,
  },
  image: {
    width: W,
    height: W * 0.65,
  },
  body: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
  },
  rankBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    marginBottom: spacing.sm,
  },
  rankText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  englishName: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.primary,
    lineHeight: 30,
  },
  thaiName: {
    fontSize: 15,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    marginBottom: spacing.md,
  },
  description: {
    fontSize: 15,
    color: colors.text,
    lineHeight: 22,
    marginBottom: spacing.md,
  },
  explanationBox: {
    backgroundColor: '#FFF8F0',
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.md,
  },
  explanationText: {
    fontSize: 14,
    color: '#444',
    fontStyle: 'italic',
    lineHeight: 20,
  },
  vendorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
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
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  mapsBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },
});
