import { router } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewToken,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DishCard } from '../components/DishCard';
import { colors, radius, spacing } from '../constants/theme';
import { RecommendResult } from '../utils/api';
import { store } from '../utils/store';

const { width: W } = Dimensions.get('window');

export default function ResultsScreen() {
  const results: RecommendResult[] = store.getResults();
  const [activeIndex, setActiveIndex] = useState(0);

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index != null) {
        setActiveIndex(viewableItems[0].index);
      }
    },
  ).current;

  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const handleTryAgain = () => {
    store.reset();
    router.replace('/');
  };

  if (!results.length) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <Text style={styles.errorText}>No results found. Try again.</Text>
          <TouchableOpacity style={styles.tryAgainBtn} onPress={handleTryAgain}>
            <Text style={styles.tryAgainText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerLabel}>Your Thai Matches</Text>
        <Text style={styles.headerSub}>Swipe to browse your top {results.length} picks</Text>
      </View>

      {/* Page dots */}
      <View style={styles.dots}>
        {results.map((_, i) => (
          <View
            key={i}
            style={[styles.dot, i === activeIndex && styles.dotActive]}
          />
        ))}
      </View>

      {/* Horizontal dish pager */}
      <FlatList
        data={results}
        keyExtractor={(_, i) => String(i)}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        renderItem={({ item, index }) => (
          <DishCard result={item} rank={index} />
        )}
        style={styles.list}
        getItemLayout={(_, index) => ({
          length: W,
          offset: W * index,
          index,
        })}
      />

      {/* Fixed bottom bar */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.tryAgainBtn} onPress={handleTryAgain}>
          <Text style={styles.tryAgainText}>↩  Try Again</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
  },
  headerLabel: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.primary,
  },
  headerSub: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: radius.full,
    backgroundColor: colors.border,
  },
  dotActive: {
    backgroundColor: colors.primary,
    width: 20,
  },
  list: {
    flex: 1,
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.bg,
  },
  tryAgainBtn: {
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderRadius: radius.full,
    paddingVertical: spacing.sm + 2,
    alignItems: 'center',
  },
  tryAgainText: {
    color: colors.primary,
    fontWeight: '700',
    fontSize: 16,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
  },
  errorText: {
    color: colors.textSecondary,
    fontSize: 16,
  },
});
