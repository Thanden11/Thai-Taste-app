import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SwipeCard } from '../components/SwipeCard';
import { colors, radius, spacing } from '../constants/theme';
import { GlobalFood, fetchNextCard, fetchRecommendation } from '../utils/api';
import { store } from '../utils/store';

const MIN_LIKES = 3;

type Status = 'loading' | 'ready' | 'done' | 'matching' | 'error';

export default function SwipeScreen() {
  const [card, setCard] = useState<GlobalFood | null>(null);
  const [status, setStatus] = useState<Status>('loading');
  const [cardKey, setCardKey] = useState(0);
  const [likedCount, setLikedCount] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');
  const matchBtnOpacity = useRef(new Animated.Value(0)).current;

  const loadNextCard = useCallback(async () => {
    setStatus('loading');
    try {
      const next = await fetchNextCard(store.getLikedIds(), store.getSeenIds());
      if (!next) {
        setStatus('done');
      } else {
        setCard(next);
        setCardKey((k) => k + 1);
        setStatus('ready');
      }
    } catch (e) {
      setErrorMsg(String(e));
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    loadNextCard();
  }, [loadNextCard]);

  // Animate match button in when we hit MIN_LIKES
  useEffect(() => {
    if (likedCount >= MIN_LIKES) {
      Animated.spring(matchBtnOpacity, {
        toValue: 1,
        useNativeDriver: true,
      }).start();
    }
  }, [likedCount, matchBtnOpacity]);

  const handleLike = useCallback(async () => {
    if (!card) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    store.addLiked(card.id);
    const newCount = likedCount + 1;
    setLikedCount(newCount);
    await loadNextCard();
  }, [card, likedCount, loadNextCard]);

  const handlePass = useCallback(async () => {
    if (!card) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    store.addSeen(card.id);
    await loadNextCard();
  }, [card, loadNextCard]);

  const handleSeeMatches = async () => {
    setStatus('matching');
    try {
      const results = await fetchRecommendation(store.getLikedIds());
      store.setResults(results);
      router.replace('/results');
    } catch (e) {
      setErrorMsg(String(e));
      setStatus('error');
    }
  };

  // ── Header ──────────────────────────────────────────────────────────────────
  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity onPress={() => router.replace('/')} style={styles.backBtn}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Pick your favourites</Text>
      <View style={styles.likeCounter}>
        <Text style={styles.likeCounterText}>♥ {likedCount}</Text>
      </View>
    </View>
  );

  // ── States ───────────────────────────────────────────────────────────────────
  if (status === 'error') {
    return (
      <SafeAreaView style={styles.safe}>
        {renderHeader()}
        <View style={styles.center}>
          <Text style={styles.errorEmoji}>😕</Text>
          <Text style={styles.errorText}>
            {errorMsg.includes('fetch') || errorMsg.includes('network')
              ? 'Cannot reach the backend.\nMake sure docker compose is running.'
              : errorMsg}
          </Text>
          <TouchableOpacity style={styles.retryBtn} onPress={loadNextCard}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (status === 'done') {
    return (
      <SafeAreaView style={styles.safe}>
        {renderHeader()}
        <View style={styles.center}>
          <Text style={styles.doneEmoji}>🎉</Text>
          <Text style={styles.doneText}>You've seen all the dishes!</Text>
          {likedCount > 0 ? (
            <TouchableOpacity style={styles.matchBtn} onPress={handleSeeMatches}>
              <Text style={styles.matchBtnText}>See My Thai Matches →</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.retryBtn} onPress={() => router.replace('/')}>
              <Text style={styles.retryText}>Start Over</Text>
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaView>
    );
  }

  if (status === 'matching') {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.matchingText}>Finding your Thai match...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      {renderHeader()}

      <View style={styles.hint}>
        <Text style={styles.hintText}>← Pass  ·  Like →</Text>
      </View>

      <View style={styles.cardArea}>
        {status === 'loading' || !card ? (
          <ActivityIndicator size="large" color={colors.primary} />
        ) : (
          <SwipeCard
            key={cardKey}
            food={card}
            onLike={handleLike}
            onPass={handlePass}
          />
        )}
      </View>

      {/* Floating "See Matches" — slides in after MIN_LIKES */}
      <Animated.View style={[styles.matchBtnWrapper, { opacity: matchBtnOpacity }]}>
        {likedCount >= MIN_LIKES && (
          <TouchableOpacity style={styles.matchBtn} onPress={handleSeeMatches}>
            <Text style={styles.matchBtnText}>See My Thai Matches  →</Text>
          </TouchableOpacity>
        )}
      </Animated.View>
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
    paddingVertical: spacing.sm,
  },
  backBtn: {
    padding: spacing.xs,
  },
  backText: {
    color: colors.textSecondary,
    fontSize: 15,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  likeCounter: {
    backgroundColor: colors.primaryBg,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  likeCounterText: {
    color: colors.primary,
    fontWeight: '700',
    fontSize: 14,
  },
  hint: {
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  hintText: {
    color: colors.textMuted,
    fontSize: 13,
    letterSpacing: 0.3,
  },
  cardArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  matchBtnWrapper: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  matchBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    paddingVertical: spacing.md,
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 5,
  },
  matchBtnText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },
  errorEmoji: { fontSize: 48 },
  errorText: {
    textAlign: 'center',
    color: colors.textSecondary,
    fontSize: 15,
    lineHeight: 22,
  },
  retryBtn: {
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderRadius: radius.full,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm + 2,
  },
  retryText: {
    color: colors.primary,
    fontWeight: '700',
    fontSize: 15,
  },
  doneEmoji: { fontSize: 48 },
  doneText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
  },
  matchingText: {
    marginTop: spacing.md,
    color: colors.textSecondary,
    fontSize: 16,
  },
});
