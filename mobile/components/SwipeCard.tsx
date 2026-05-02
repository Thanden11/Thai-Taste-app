import React, { useRef } from 'react';
import {
  Animated,
  Dimensions,
  Image,
  PanResponder,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { colors, radius, spacing } from '../constants/theme';
import { GlobalFood } from '../utils/api';

const { width: W, height: H } = Dimensions.get('window');
const CARD_W = W - spacing.lg * 2;
const CARD_HEIGHT = H * 0.58;
const THRESHOLD = W * 0.25;

type Props = {
  food: GlobalFood;
  onLike: () => void;
  onPass: () => void;
  /** Next card to show behind current (for stack effect) */
  nextFood?: GlobalFood | null;
};

export function SwipeCard({ food, onLike, onPass, nextFood }: Props) {
  const pos = useRef(new Animated.ValueXY()).current;
  const swiped = useRef(false);

  // Back card scale: starts small, grows as you drag
  const backScale = pos.x.interpolate({
    inputRange: [-THRESHOLD, 0, THRESHOLD],
    outputRange: [1, 0.92, 1],
    extrapolate: 'clamp',
  });
  const backOpacity = pos.x.interpolate({
    inputRange: [-THRESHOLD, 0, THRESHOLD],
    outputRange: [1, 0.6, 1],
    extrapolate: 'clamp',
  });

  const animateOut = (direction: 'like' | 'pass') => {
    if (swiped.current) return;
    swiped.current = true;
    const toX = direction === 'like' ? W * 1.5 : -W * 1.5;
    Animated.timing(pos, {
      toValue: { x: toX, y: -50 },
      duration: 300,
      useNativeDriver: false,
    }).start(() => {
      direction === 'like' ? onLike() : onPass();
    });
  };

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: Animated.event([null, { dx: pos.x, dy: pos.y }], {
        useNativeDriver: false,
      }),
      onPanResponderRelease: (_, g) => {
        if (g.dx > THRESHOLD) animateOut('like');
        else if (g.dx < -THRESHOLD) animateOut('pass');
        else
          Animated.spring(pos, {
            toValue: { x: 0, y: 0 },
            friction: 5,
            tension: 80,
            useNativeDriver: false,
          }).start();
      },
    }),
  ).current;

  const rotate = pos.x.interpolate({
    inputRange: [-W / 2, 0, W / 2],
    outputRange: ['-10deg', '0deg', '10deg'],
  });
  const likeOpacity = pos.x.interpolate({
    inputRange: [0, THRESHOLD * 0.6],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });
  const passOpacity = pos.x.interpolate({
    inputRange: [-THRESHOLD * 0.6, 0],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const imageUri = food.remote_image_url || food.image_url;
  const nextImageUri = nextFood
    ? nextFood.remote_image_url || nextFood.image_url
    : null;

  return (
    <View style={styles.root}>
      {/* ── Back card (next in stack) ── */}
      {nextFood && nextImageUri && (
        <Animated.View
          style={[
            styles.card,
            styles.backCard,
            {
              transform: [{ scale: backScale }],
              opacity: backOpacity,
            },
          ]}
        >
          <Image
            source={{ uri: nextImageUri }}
            style={styles.image}
            resizeMode="cover"
          />
          <View style={styles.footer}>
            <Text style={styles.foodName}>{nextFood.name}</Text>
          </View>
        </Animated.View>
      )}

      {/* ── Front card (swipeable) ── */}
      <Animated.View
        {...pan.panHandlers}
        style={[
          styles.card,
          {
            transform: [
              { translateX: pos.x },
              { translateY: pos.y },
              { rotate },
            ],
          },
        ]}
      >
        <Image
          source={{ uri: imageUri }}
          style={styles.image}
          resizeMode="cover"
        />

        {/* LIKE stamp */}
        <Animated.View
          style={[styles.stamp, styles.likeStamp, { opacity: likeOpacity }]}
        >
          <Text style={styles.likeStampText}>LIKE</Text>
        </Animated.View>

        {/* NOPE stamp */}
        <Animated.View
          style={[styles.stamp, styles.nopeStamp, { opacity: passOpacity }]}
        >
          <Text style={styles.nopeStampText}>NOPE</Text>
        </Animated.View>

        {/* Gradient overlay + name */}
        <View style={styles.gradient}>
          <Text style={styles.foodName}>{food.name}</Text>
          {food.sensory_string ? (
            <Text style={styles.sensory} numberOfLines={1}>
              {food.sensory_string}
            </Text>
          ) : null}
        </View>
      </Animated.View>

      {/* ── Action buttons ── */}
      <View style={styles.buttons}>
        <TouchableOpacity
          style={[styles.btn, styles.passBtn]}
          onPress={() => animateOut('pass')}
          activeOpacity={0.8}
          accessibilityLabel="Pass"
        >
          <Text style={styles.passBtnIcon}>✕</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.btn, styles.likeBtn]}
          onPress={() => animateOut('like')}
          activeOpacity={0.8}
          accessibilityLabel="Like"
        >
          <Text style={styles.likeBtnIcon}>♥</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    alignItems: 'center',
  },
  card: {
    width: CARD_W,
    height: CARD_HEIGHT,
    borderRadius: radius.lg,
    backgroundColor: colors.card,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
    overflow: 'hidden',
  },
  backCard: {
    position: 'absolute',
    top: 8,
    zIndex: -1,
  },
  image: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  stamp: {
    position: 'absolute',
    top: 40,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: radius.sm,
    borderWidth: 4,
  },
  likeStamp: {
    left: 24,
    borderColor: colors.success,
    backgroundColor: 'rgba(42,157,92,0.2)',
    transform: [{ rotate: '-18deg' }],
  },
  nopeStamp: {
    right: 24,
    borderColor: colors.danger,
    backgroundColor: 'rgba(230,57,70,0.2)',
    transform: [{ rotate: '18deg' }],
  },
  likeStampText: {
    color: colors.success,
    fontWeight: '900',
    fontSize: 28,
    letterSpacing: 3,
  },
  nopeStampText: {
    color: colors.danger,
    fontWeight: '900',
    fontSize: 28,
    letterSpacing: 3,
  },
  gradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.md + 4,
    paddingTop: spacing.xl * 2,
    paddingBottom: spacing.md + 4,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  foodName: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  sensory: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 13,
    marginTop: 4,
    fontWeight: '500',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  buttons: {
    flexDirection: 'row',
    marginTop: spacing.lg,
    gap: spacing.xl * 1.5,
  },
  btn: {
    width: 68,
    height: 68,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  passBtn: {
    backgroundColor: '#fff',
    borderWidth: 2.5,
    borderColor: colors.danger,
  },
  likeBtn: {
    backgroundColor: colors.success,
    borderWidth: 2.5,
    borderColor: colors.success,
  },
  passBtnIcon: {
    fontSize: 26,
    color: colors.danger,
    fontWeight: '800',
  },
  likeBtnIcon: {
    fontSize: 26,
    color: '#fff',
    fontWeight: '800',
  },
});
