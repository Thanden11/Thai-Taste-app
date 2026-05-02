import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SwipeCard } from '../components/SwipeCard';
import { colors, radius, spacing } from '../constants/theme';
import {
  GlobalFood,
  fetchAllGlobalFoods,
  fetchNextCard,
  fetchRecommendation,
} from '../utils/api';
import { store } from '../utils/store';

const MIN_LIKES = 3;
const MATCHING_EMOJIS = ['🍜', '🔥', '🌶️', '🥘', '✨'];

type Status = 'loading' | 'ready' | 'done' | 'matching' | 'error';

export default function SwipeScreen() {
  const [deck, setDeck] = useState<GlobalFood[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [status, setStatus] = useState<Status>('loading');
  const [cardKey, setCardKey] = useState(0);
  const [likedCount, setLikedCount] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');
  const [matchingStep, setMatchingStep] = useState(0);
  const matchBtnScale = useRef(new Animated.Value(0)).current;
  const matchingRotate = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Load all cards upfront for smooth stacking
  const loadDeck = useCallback(async () => {
    setStatus('loading');
    try {
      const foods = await fetchAllGlobalFoods();
      if (!foods.length) {
        setStatus('done');
        return;
      }
      // Shuffle for variety
      const shuffled = foods.sort(() => Math.random() - 0.5);
      setDeck(shuffled);
      setCurrentIndex(0);
      setStatus('ready');
    } catch (e) {
      // Fallback to one-by-one loading
      try {
        const next = await fetchNextCard(
          store.getLikedIds(),
          store.getSeenIds(),
          store.getDietaryRestrictions(),
        );
        if (!next) {
          setStatus('done');
        } else {
          setDeck([next]);
          setCurrentIndex(0);
          setStatus('ready');
        }
      } catch (e2) {
        setErrorMsg(String(e2));
        setStatus('error');
      }
    }
  }, []);

  useEffect(() => {
    loadDeck();
  }, [loadDeck]);

  // Animate match button bounce in
  useEffect(() => {
    if (likedCount >= MIN_LIKES) {
      Animated.spring(matchBtnScale, {
        toValue: 1,
        friction: 4,
        tension: 100,
        useNativeDriver: true,
      }).start();
      // Pulse animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ]),
      ).start();
    }
  }, [likedCount, matchBtnScale, pulseAnim]);

  // Matching animation — rotating emoji
  useEffect(() => {
    if (status === 'matching') {
      const emojiInterval = setInterval(() => {
        setMatchingStep((s) => (s + 1) % MATCHING_EMOJIS.length);
      }, 600);
      Animated.loop(
        Animated.timing(matchingRotate, {
          toValue: 1,
          duration: 1500,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ).start();
      return () => clearInterval(emojiInterval);
    }
  }, [status, matchingRotate]);

  const currentCard = deck[currentIndex] ?? null;
  const nextCard = deck[currentIndex + 1] ?? null;

  const advanceCard = useCallback(() => {
    const nextIdx = currentIndex + 1;
    if (nextIdx >= deck.length) {
      setStatus('done');
    } else {
      setCurrentIndex(nextIdx);
      setCardKey((k) => k + 1);
    }
  }, [currentIndex, deck.length]);

  const handleLike = useCallback(() => {
    if (!currentCard) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    store.addLiked(currentCard.id);
    setLikedCount((c) => c + 1);
    advanceCard();
  }, [currentCard, advanceCard]);

  const handlePass = useCallback(() => {
    if (!currentCard) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    store.addSeen(currentCard.id);
    advanceCard();
  }, [currentCard, advanceCard]);

  const handleSeeMatches = async () => {
    setStatus('matching');
    try {
      const results = await fetchRecommendation(
        store.getLikedIds(),
        store.getDietaryRestrictions(),
      );
      store.setResults(results);
      router.replace('/results');
    } catch (e) {
      setErrorMsg(String(e));
      setStatus('error');
    }
  };

  const totalCards = deck.length;
  const progress = totalCards > 0 ? currentIndex / totalCards : 0;

  // ── Header ──
  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity
        onPress={() => router.replace('/')}
        style={styles.backBtn}
      >
        <Text style={styles.backText}>←</Text>
      </TouchableOpacity>
      <View style={styles.headerCenter}>
        <Text style={styles.headerTitle}>Thai Taste</Text>
        <Text style={styles.headerSub}>
          {currentIndex + 1} / {totalCards}
        </Text>
      </View>
      <View style={styles.likeCounter}>
        <Text style={styles.likeCounterText}>♥ {likedCount}</Text>
      </View>
    </View>
  );

  // ── Progress bar ──
  const renderProgress = () => (
    <View style={styles.progressBar}>
      <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
    </View>
  );

  // ── Error state ──
  if (status === 'error') {
    return (
      <SafeAreaView style={styles.safe}>
        {renderHeader()}
        <View style={styles.center}>
          <Text style={styles.errorEmoji}>😕</Text>
          <Text style={styles.errorTitle}>Oops!</Text>
          <Text style={styles.errorText}>
            {errorMsg.includes('fetch') || errorMsg.includes('network')
              ? "Can't reach the backend.\nMake sure docker compose is running."
              : errorMsg}
          </Text>
          <TouchableOpacity style={styles.retryBtn} onPress={loadDeck}>
            <Text style={styles.retryText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ── Done state ──
  if (status === 'done') {
    return (
      <SafeAreaView style={styles.safe}>
        {renderHeader()}
        <View style={styles.center}>
          <Text style={styles.doneEmoji}>🎉</Text>
          <Text style={styles.doneTitle}>All done!</Text>
          <Text style={styles.doneText}>
            You swiped through all the dishes.
            {likedCount > 0
              ? `\nYou liked ${likedCount} — let's find your Thai match!`
              : ''}
          </Text>
          {likedCount > 0 ? (
            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={handleSeeMatches}
            >
              <Text style={styles.primaryBtnText}>
                Find My Thai Match 🍜
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.retryBtn}
              onPress={() => router.replace('/')}
            >
              <Text style={styles.retryText}>Start Over</Text>
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaView>
    );
  }

  // ── Matching state ──
  if (status === 'matching') {
    const spin = matchingRotate.interpolate({
      inputRange: [0, 1],
      outputRange: ['0deg', '360deg'],
    });
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <Animated.Text
            style={[styles.matchingEmoji, { transform: [{ rotate: spin }] }]}
          >
            {MATCHING_EMOJIS[matchingStep]}
          </Animated.Text>
          <Text style={styles.matchingTitle}>Finding your match...</Text>
          <Text style={styles.matchingText}>
            Analyzing your taste fingerprint
          </Text>
          <ActivityIndicator
            size="small"
            color={colors.primary}
            style={{ marginTop: spacing.md }}
          />
        </View>
      </SafeAreaView>
    );
  }

  // ── Main swipe view ──
  return (
    <SafeAreaView style={styles.safe}>
      {renderHeader()}
      {renderProgress()}

      <View style={styles.hint}>
        <Text style={styles.hintText}>← NOPE · LIKE →</Text>
      </View>

      <View style={styles.cardArea}>
        {status === 'loading' || !currentCard ? (
          <ActivityIndicator size="large" color={colors.primary} />
        ) : (
          <SwipeCard
            key={cardKey}
            food={currentCard}
            nextFood={nextCard}
            onLike={handleLike}
            onPass={handlePass}
          />
        )}
      </View>

      {/* Floating "See Matches" button */}
      {likedCount >= MIN_LIKES && (
        <Animated.View
          style={[
            styles.matchBtnWrapper,
            {
              transform: [
                { scale: Animated.multiply(matchBtnScale, pulseAnim) },
              ],
            },
          ]}
        >
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={handleSeeMatches}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryBtnText}>
              See My Thai Matches →
            </Text>
          </TouchableOpacity>
        </Animated.View>
      )}
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
    width: 36,
    height: 36,
    borderRadius: radius.full,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  backText: {
    fontSize: 18,
    color: colors.text,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: -0.3,
  },
  headerSub: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '500',
  },
  likeCounter: {
    backgroundColor: 'rgba(42,157,92,0.12)',
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm + 4,
    paddingVertical: spacing.xs + 2,
  },
  likeCounterText: {
    color: colors.success,
    fontWeight: '800',
    fontSize: 14,
  },
  progressBar: {
    height: 3,
    backgroundColor: colors.border,
    marginHorizontal: spacing.md,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 2,
  },
  hint: {
    alignItems: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  hintText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1,
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
  primaryBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    paddingVertical: spacing.md + 2,
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
  primaryBtnText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
  },
  errorEmoji: { fontSize: 56 },
  errorTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
  },
  errorText: {
    textAlign: 'center',
    color: colors.textSecondary,
    fontSize: 15,
    lineHeight: 22,
  },
  retryBtn: {
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: radius.full,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm + 4,
    marginTop: spacing.sm,
  },
  retryText: {
    color: colors.primary,
    fontWeight: '700',
    fontSize: 16,
  },
  doneEmoji: { fontSize: 56 },
  doneTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.primary,
  },
  doneText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  matchingEmoji: {
    fontSize: 64,
  },
  matchingTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.primary,
    marginTop: spacing.md,
  },
  matchingText: {
    fontSize: 15,
    color: colors.textSecondary,
  },
});
