import { useEffect } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, {
  Easing,
  interpolate,
  interpolateColor,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import Svg, { Circle, Path } from 'react-native-svg';
import type { Habit } from '../data';
import { colors, hues } from '../theme';
import { RollingNumber } from './RollingNumber';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedPath = Animated.createAnimatedComponent(Path);

const HOLD_MS = 850;
const RING = 44;
const STROKE = 3;
const R = (RING - STROKE) / 2;
const CIRC = 2 * Math.PI * R;

type Props = { habit: Habit; index: number; onToggle: (id: string) => void; reduceMotion: boolean };

const tick = (style: Haptics.ImpactFeedbackStyle) => {
  if (Platform.OS !== 'web') Haptics.impactAsync(style);
};
const success = () => {
  if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
};

// Hold a card to light it. The ring fills while you hold; let go early and it
// springs back. Holding a lit card dims it again.
export function HabitCard({ habit, index, onToggle, reduceMotion }: Props) {
  const hue = hues[habit.hue];
  const hold = useSharedValue(0);
  const lit = useSharedValue(habit.done ? 1 : 0);
  const press = useSharedValue(0);
  const enter = useSharedValue(reduceMotion ? 1 : 0);

  useEffect(() => {
    lit.value = reduceMotion ? (habit.done ? 1 : 0) : withTiming(habit.done ? 1 : 0, { duration: 520, easing: Easing.bezier(0.16, 1, 0.3, 1) });
  }, [habit.done, lit, reduceMotion]);

  useEffect(() => {
    if (reduceMotion) return;
    const t = setTimeout(() => {
      enter.value = withSpring(1, { damping: 18, stiffness: 140 });
    }, 120 + index * 70);
    return () => clearTimeout(t);
  }, [enter, index, reduceMotion]);

  const finish = () => {
    success();
    onToggle(habit.id);
  };

  const onPressIn = () => {
    tick(Haptics.ImpactFeedbackStyle.Light);
    press.value = withSpring(1, { damping: 20, stiffness: 300 });
    hold.value = withTiming(1, { duration: reduceMotion ? 400 : HOLD_MS, easing: Easing.linear }, (finished) => {
      if (finished) {
        hold.value = withTiming(0, { duration: 320 });
        scheduleOnRN(finish);
      }
    });
  };

  const onPressOut = () => {
    press.value = withSpring(0, { damping: 14, stiffness: 220 });
    if (hold.value < 1) hold.value = withSpring(0, { damping: 16, stiffness: 180 });
  };

  const cardStyle = useAnimatedStyle(() => ({
    opacity: enter.value,
    transform: [
      { translateY: interpolate(enter.value, [0, 1], [18, 0]) },
      { scale: 1 - press.value * 0.025 },
    ],
    backgroundColor: interpolateColor(lit.value, [0, 1], [colors.card, hue.soft]),
    shadowColor: hue.base,
    shadowOpacity: lit.value * 0.35,
    shadowRadius: 10 + lit.value * 14,
  }));

  const ringProps = useAnimatedProps(() => ({
    strokeDashoffset: CIRC * (1 - Math.max(hold.value, lit.value)),
  }));

  const dotStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(lit.value, [0, 1], [colors.line, hue.base]),
    transform: [{ scale: 0.72 + lit.value * 0.28 + hold.value * 0.12 }],
  }));

  const checkProps = useAnimatedProps(() => ({
    strokeDashoffset: 18 * (1 - lit.value),
  }));

  return (
    <Pressable
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      accessibilityRole="button"
      accessibilityLabel={`${habit.name}, ${habit.detail}, ${habit.done ? 'done' : 'not done'}`}
      accessibilityHint={habit.done ? 'Hold to mark as not done' : 'Hold to mark as done'}
      onAccessibilityTap={() => onToggle(habit.id)}
    >
      <Animated.View style={[styles.card, cardStyle]}>
        <View style={styles.ringWrap}>
          <Svg width={RING} height={RING} style={StyleSheet.absoluteFill}>
            <Circle cx={RING / 2} cy={RING / 2} r={R} stroke={colors.line} strokeWidth={STROKE} fill="none" />
            <AnimatedCircle
              cx={RING / 2}
              cy={RING / 2}
              r={R}
              stroke={hue.base}
              strokeWidth={STROKE}
              strokeLinecap="round"
              fill="none"
              strokeDasharray={CIRC}
              animatedProps={ringProps}
              transform={`rotate(-90 ${RING / 2} ${RING / 2})`}
            />
          </Svg>
          <Animated.View style={[styles.dot, dotStyle]}>
            <Svg width={16} height={16} viewBox="0 0 16 16">
              <AnimatedPath
                d="M3.5 8.5l3 3 6-7"
                stroke="#fff"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
                strokeDasharray={18}
                animatedProps={checkProps}
              />
            </Svg>
          </Animated.View>
        </View>
        <View style={styles.copy}>
          <Text style={styles.name}>{habit.name}</Text>
          <Text style={styles.detail}>{habit.done ? 'Lit for today' : `${habit.detail} · hold to light`}</Text>
        </View>
        <View style={styles.streak}>
          <RollingNumber value={habit.streak} style={styles.streakNum} reduceMotion={reduceMotion} />
          <Text style={styles.streakLabel}>days</Text>
        </View>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.line,
    shadowOffset: { width: 0, height: 8 },
  },
  ringWrap: { width: RING, height: RING, alignItems: 'center', justifyContent: 'center' },
  dot: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  copy: { flex: 1, gap: 3 },
  name: { fontSize: 17, fontWeight: '600', color: colors.ink, letterSpacing: -0.2 },
  detail: { fontSize: 13, color: colors.mute },
  streak: { alignItems: 'flex-end' },
  streakNum: { fontSize: 22, fontWeight: '700', color: colors.ink, fontVariant: ['tabular-nums'] },
  streakLabel: { fontSize: 11, color: colors.mute, marginTop: -2 },
});
