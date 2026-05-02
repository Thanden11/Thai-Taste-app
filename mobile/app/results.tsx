import { router } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
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

const MATCH_LABELS = ['Perfect Match', '2nd Pick', '3rd Pick', '4th Pick', '5th Pick'];

export default function ResultsScreen() {
  const results: RecommendResult[] = store.getResults();
  const [activeIndex, setActiveIndex] = useState(0);
  const headerFade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(headerFade, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, [headerFade]);

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index != null) {
        setActiveIndex(viewableItems[0].index);
      }
    },
  ).current;

  const viewabilityConfig = useRef({
    viewAreaCoveragePercentThreshold: 50,
  }).current;

  const handleTryAgain = () => {
    store.reset();
    router.replace('/');
  };

  if (!results.length) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <Text style={styles.emptyEmoji}>🤔</Text>
          <Text style={styles.emptyTitle}>No matches found</Text>
          <Text style={styles.emptyText}>
            Try liking more dishes next time!
          </Text>
          <TouchableOpacity style={styles.retryBtn} onPress={handleTryAgain}>
            <Text style={styles.retryText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <Animated.View style={[styles.header, { opacity: headerFade }]}>
        <Text style={styles.headerEmoji}>🎉</Text>
        <View>
          <Text style={styles.headerLabel}>Your Thai Matches</Text>
          <Text style={styles.headerSub}>
            Top {results.length} dishes for your taste
          </Text>
        </View>
      </Animated.View>

      {/* Page indicator */}
      <View style={styles.indicators}>
        {results.map((_, i) => (
          <View key={i} style={styles.indicatorItem}>
            <View
              style={[
                styles.dot,
                i === activeIndex && styles.dotActive,
              ]}
            />
            <Text
              style={[
                styles.indicatorLabel,
                i === activeIndex && styles.indicatorLabelActive,
              ]}
            >
              {i === 0 ? '★' : `#${i + 1}`}
            </Text>
          </View>
        ))}
      </View>

      {/* Match label */}
      <View style={styles.matchLabelRow}>
        <View
          style={[
            styles.matchLabelBadge,
            activeIndex === 0 && styles.matchLabelBadgeBest,
          ]}
        >
          <Text
            style={[
              styles.matchLabelText,
              activeIndex === 0 && styles.matchLabelTextBest,
            ]}
          >
            {MATCH_LABELS[activeIndex] ?? `#${activeIndex + 1}`}
          </Text>
        </View>
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
        <TouchableOpacity style={styles.retryBtn} onPress={handleTryAgain}>
          <Text style={styles.retryText}>↩ Start Over</Text>
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
    gap: spacing.sm,
  },
  headerEmoji: {
    fontSize: 28,
  },
  headerLabel: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.primary,
    letterSpacing: -0.5,
  },
  headerSub: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 1,
  },
  indicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.md,
    paddingVertical: spacing.xs,
  },
  indicatorItem: {
    alignItems: 'center',
    gap: 3,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: radius.full,
    backgroundColor: colors.border,
  },
  dotActive: {
    backgroundColor: colors.primary,
    width: 22,
  },
  indicatorLabel: {
    fontSize: 10,
    color: colors.textMuted,
    fontWeight: '600',
  },
  indicatorLabelActive: {
    color: colors.primary,
    fontWeight: '800',
  },
  matchLabelRow: {
    alignItems: 'center',
    paddingBottom: spacing.xs,
  },
  matchLabelBadge: {
    backgroundColor: colors.primaryBg,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  matchLabelBadgeBest: {
    backgroundColor: colors.primary,
  },
  matchLabelText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
  matchLabelTextBest: {
    color: '#fff',
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
  retryBtn: {
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: radius.full,
    paddingVertical: spacing.sm + 4,
    alignItems: 'center',
  },
  retryText: {
    color: colors.primary,
    fontWeight: '700',
    fontSize: 16,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
  },
  emptyEmoji: { fontSize: 56 },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: 15,
    textAlign: 'center',
  },
});
