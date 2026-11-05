import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import { colors, hues } from '../theme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const SIZE = 30;
const STROKE = 3;
const R = (SIZE - STROKE) / 2;
const CIRC = 2 * Math.PI * R;
const soft = Easing.bezier(0.16, 1, 0.3, 1);

type DayProps = { label: string; value: number; index: number; today: boolean; reduceMotion: boolean };

// One day of the week. Past days fill in a quick cascade on load; today keeps
// following the habits you light, and pops when every one is on.
function Day({ label, value, index, today, reduceMotion }: DayProps) {
  const fill = useSharedValue(reduceMotion ? value : 0);
  const pop = useSharedValue(0);
  const full = value >= 1;

  useEffect(() => {
    if (reduceMotion) {
      fill.value = value;
      return;
    }
    const delay = today ? 0 : 260 + index * 55;
    fill.value = withDelay(delay, withTiming(value, { duration: 620, easing: soft }));
  }, [value, index, today, reduceMotion, fill]);

  useEffect(() => {
    if (!today || reduceMotion) return;
    if (full) pop.value = withSequence(withTiming(1, { duration: 140, easing: soft }), withSpring(0, { damping: 10, stiffness: 220 }));
  }, [full, today, reduceMotion, pop]);

  const ring = useAnimatedProps(() => ({ strokeDashoffset: CIRC * (1 - fill.value) }));
  const core = useAnimatedStyle(() => ({
    opacity: fill.value >= 0.999 ? 1 : 0,
    transform: [{ scale: (0.6 + Math.min(1, fill.value) * 0.4) * (1 + pop.value * 0.35) }],
  }));

  return (
    <View style={styles.day} accessibilityLabel={`${label}, ${Math.round(value * 100)} percent`}>
      <Text style={[styles.label, today && styles.labelToday]}>{label}</Text>
      <View style={styles.ringWrap}>
        <Svg width={SIZE} height={SIZE} style={StyleSheet.absoluteFill}>
          <Circle cx={SIZE / 2} cy={SIZE / 2} r={R} stroke={colors.line} strokeWidth={STROKE} fill="none" />
          <AnimatedCircle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={R}
            stroke={hues.amber.base}
            strokeWidth={STROKE}
            strokeLinecap="round"
            fill="none"
            strokeDasharray={CIRC}
            animatedProps={ring}
            transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
          />
        </Svg>
        <Animated.View style={[styles.core, core]} />
      </View>
      {today && <View style={styles.todayDot} />}
    </View>
  );
}

const LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
// A believable recent week so the strip has a shape before you use it.
const PAST = [1, 0.75, 1, 0.5, 1, 0.75, 1];

export function WeekStrip({ today: todayValue, reduceMotion }: { today: number; reduceMotion: boolean }) {
  const todayIndex = (new Date().getDay() + 6) % 7;
  return (
    <View style={styles.strip}>
      {LABELS.map((label, i) => {
        const isToday = i === todayIndex;
        const value = i < todayIndex ? PAST[i] : isToday ? todayValue : 0;
        return <Day key={i} label={label} value={value} index={i} today={isToday} reduceMotion={reduceMotion} />;
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  strip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.line,
  },
  day: { alignItems: 'center', gap: 6, minWidth: 30 },
  label: { fontSize: 11, color: colors.mute, fontWeight: '600', letterSpacing: 0.4 },
  labelToday: { color: colors.ink },
  ringWrap: { width: SIZE, height: SIZE, alignItems: 'center', justifyContent: 'center' },
  core: { width: 14, height: 14, borderRadius: 7, backgroundColor: hues.amber.base },
  todayDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: colors.ink, marginTop: -1 },
});
