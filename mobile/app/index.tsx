import { router } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radius, spacing } from '../constants/theme';
import { store } from '../utils/store';

const FOOD_RING = ['🍕', '🍣', '🌮', '🍜', '🍛', '🥘'];

const STEPS = [
  { num: '1', icon: '👆', text: 'Swipe right on foods you love' },
  { num: '2', icon: '🤖', text: 'AI builds your flavour fingerprint' },
  { num: '3', icon: '🗺️', text: 'Get your Thai match + directions' },
];

export default function WelcomeScreen() {
  const floatAnim = useRef(new Animated.Value(0)).current;
  const fadeIn = useRef(new Animated.Value(0)).current;
  const slideUp = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    // Floating emoji animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 2000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    ).start();

    // Entrance animation
    Animated.parallel([
      Animated.timing(fadeIn, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideUp, {
        toValue: 0,
        duration: 800,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [floatAnim, fadeIn, slideUp]);

  const handleStart = () => {
    store.reset();
    router.push('/onboarding');
  };

  const floatY = floatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -12],
  });

  return (
    <SafeAreaView style={styles.safe}>
      <Animated.View
        style={[
          styles.container,
          { opacity: fadeIn, transform: [{ translateY: slideUp }] },
        ]}
      >
        {/* Hero */}
        <View style={styles.hero}>
          {/* Food emoji ring */}
          <Animated.View
            style={[styles.emojiRing, { transform: [{ translateY: floatY }] }]}
          >
            {FOOD_RING.map((emoji, i) => {
              const angle = (i / FOOD_RING.length) * 2 * Math.PI - Math.PI / 2;
              const ringRadius = 52;
              return (
                <Text
                  key={i}
                  style={[
                    styles.ringEmoji,
                    {
                      left: 50 + ringRadius * Math.cos(angle) - 14,
                      top: 50 + ringRadius * Math.sin(angle) - 14,
                    },
                  ]}
                >
                  {emoji}
                </Text>
              );
            })}
            <Text style={styles.centerEmoji}>🇹🇭</Text>
          </Animated.View>

          <Text style={styles.title}>Thai Taste</Text>
          <Text style={styles.tagline}>Your Food Tinder for Thailand</Text>
          <Text style={styles.subtitle}>
            Swipe dishes you love. We'll match you{'\n'}with the perfect Thai
            street food.
          </Text>
        </View>

        {/* Steps */}
        <View style={styles.steps}>
          {STEPS.map((step, i) => (
            <View key={i} style={styles.step}>
              <View style={styles.stepNum}>
                <Text style={styles.stepNumText}>{step.num}</Text>
              </View>
              <Text style={styles.stepIcon}>{step.icon}</Text>
              <Text style={styles.stepText}>{step.text}</Text>
            </View>
          ))}
        </View>

        {/* CTA */}
        <TouchableOpacity
          style={styles.startBtn}
          onPress={handleStart}
          activeOpacity={0.85}
        >
          <Text style={styles.startBtnText}>Start Exploring</Text>
        </TouchableOpacity>

        <Text style={styles.footer}>
          Powered by AI · Built for hungry travellers
        </Text>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  container: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    justifyContent: 'center',
  },
  hero: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  emojiRing: {
    width: 100,
    height: 100,
    marginBottom: spacing.lg,
    position: 'relative',
  },
  ringEmoji: {
    position: 'absolute',
    fontSize: 22,
  },
  centerEmoji: {
    position: 'absolute',
    fontSize: 36,
    left: 50 - 18,
    top: 50 - 18,
  },
  title: {
    fontSize: 44,
    fontWeight: '900',
    color: colors.primary,
    letterSpacing: -1.5,
  },
  tagline: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primaryLight,
    marginTop: spacing.xs,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginTop: spacing.sm,
  },
  steps: {
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 4,
    gap: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  stepNum: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primaryBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.primary,
  },
  stepIcon: {
    fontSize: 20,
  },
  stepText: {
    fontSize: 15,
    color: colors.text,
    fontWeight: '500',
    flex: 1,
  },
  startBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    paddingVertical: spacing.md + 4,
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 14,
    elevation: 6,
  },
  startBtnText: {
    color: '#fff',
    fontSize: 19,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  footer: {
    textAlign: 'center',
    color: colors.textMuted,
    fontSize: 12,
    marginTop: spacing.lg,
    fontWeight: '500',
  },
});
