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
const CARD_HEIGHT = H * 0.62;
const THRESHOLD = W * 0.28;

type Props = {
  food: GlobalFood;
  onLike: () => void;
  onPass: () => void;
};

export function SwipeCard({ food, onLike, onPass }: Props) {
  const pos = useRef(new Animated.ValueXY()).current;
  const swiped = useRef(false);

  const animateOut = (direction: 'like' | 'pass') => {
    if (swiped.current) return;
    swiped.current = true;
    Animated.timing(pos, {
      toValue: { x: direction === 'like' ? W * 1.5 : -W * 1.5, y: 0 },
      duration: 250,
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
            useNativeDriver: false,
          }).start();
      },
    }),
  ).current;

  const rotate = pos.x.interpolate({
    inputRange: [-W / 2, 0, W / 2],
    outputRange: ['-12deg', '0deg', '12deg'],
  });
  const likeOpacity = pos.x.interpolate({
    inputRange: [0, THRESHOLD],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });
  const passOpacity = pos.x.interpolate({
    inputRange: [-THRESHOLD, 0],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const imageUri = food.remote_image_url || food.image_url;

  return (
    <View style={styles.root}>
      {/* ── Card ── */}
      <Animated.View
        {...pan.panHandlers}
        style={[
          styles.card,
          { transform: [{ translateX: pos.x }, { translateY: pos.y }, { rotate }] },
        ]}
      >
        <Image
          source={{ uri: imageUri }}
          style={styles.image}
          resizeMode="cover"
        />

        <Animated.View style={[styles.badge, styles.likeBadge, { opacity: likeOpacity }]}>
          <Text style={styles.likeText}>LIKE</Text>
        </Animated.View>
        <Animated.View style={[styles.badge, styles.passBadge, { opacity: passOpacity }]}>
          <Text style={styles.passText}>PASS</Text>
        </Animated.View>

        <View style={styles.footer}>
          <Text style={styles.foodName}>{food.name}</Text>
        </View>
      </Animated.View>

      {/* ── Buttons (tap fallback for web / accessibility) ── */}
      <View style={styles.buttons}>
        <TouchableOpacity
          style={[styles.btn, styles.passBtn]}
          onPress={() => animateOut('pass')}
          accessibilityLabel="Pass"
        >
          <Text style={styles.passBtnIcon}>✕</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.btn, styles.likeBtn]}
          onPress={() => animateOut('like')}
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
    width: W - spacing.lg * 2,
    height: CARD_HEIGHT,
    borderRadius: radius.lg,
    backgroundColor: colors.card,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  badge: {
    position: 'absolute',
    top: 32,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: radius.sm,
    borderWidth: 3,
  },
  likeBadge: {
    left: 20,
    borderColor: colors.success,
    backgroundColor: 'rgba(42,157,92,0.15)',
    transform: [{ rotate: '-15deg' }],
  },
  passBadge: {
    right: 20,
    borderColor: colors.danger,
    backgroundColor: 'rgba(230,57,70,0.15)',
    transform: [{ rotate: '15deg' }],
  },
  likeText: {
    color: colors.success,
    fontWeight: '800',
    fontSize: 22,
    letterSpacing: 2,
  },
  passText: {
    color: colors.danger,
    fontWeight: '800',
    fontSize: 22,
    letterSpacing: 2,
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
  foodName: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },
  buttons: {
    flexDirection: 'row',
    marginTop: spacing.lg,
    gap: spacing.xl,
  },
  btn: {
    width: 64,
    height: 64,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  passBtn: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: colors.danger,
  },
  likeBtn: {
    backgroundColor: colors.primary,
  },
  passBtnIcon: {
    fontSize: 22,
    color: colors.danger,
    fontWeight: '700',
  },
  likeBtnIcon: {
    fontSize: 22,
    color: '#fff',
    fontWeight: '700',
  },
});
