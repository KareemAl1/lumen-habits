import { useEffect, useMemo } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming, type SharedValue } from 'react-native-reanimated';
import { hues } from '../theme';

const COUNT = 22;
const palette = Object.values(hues).map((h) => h.base);

type Spark = { angle: number; reach: number; size: number; color: string; delay: number; drift: number };

function SparkDot({ spark, t }: { spark: Spark; t: SharedValue<number> }) {
  const style = useAnimatedStyle(() => {
    // Each light starts a little late, flies out fast, then slows and falls.
    const p = Math.min(1, Math.max(0, (t.value - spark.delay) / (1 - spark.delay)));
    const out = 1 - (1 - p) * (1 - p) * (1 - p);
    const x = Math.cos(spark.angle) * spark.reach * out + spark.drift * p;
    const y = Math.sin(spark.angle) * spark.reach * out + 90 * p * p;
    return {
      opacity: p <= 0 ? 0 : p < 0.7 ? 1 : (1 - p) / 0.3,
      transform: [{ translateX: x }, { translateY: y }, { scale: 0.4 + out * 0.6 - p * p * 0.5 }],
    };
  });
  return (
    <Animated.View
      style={[
        styles.spark,
        { width: spark.size, height: spark.size, borderRadius: spark.size / 2, backgroundColor: spark.color },
        style,
      ]}
    />
  );
}

// When the last habit of the day lights up, the lights you earned scatter
// from the progress bar once. `burst` changes each time that happens.
export function AllLit({ burst, reduceMotion }: { burst: number; reduceMotion: boolean }) {
  const t = useSharedValue(1);
  const sparks = useMemo<Spark[]>(
    () =>
      Array.from({ length: COUNT }, (_, i) => ({
        // Fan upward and outward, never straight down.
        angle: -Math.PI * (0.08 + 0.84 * ((i + Math.random() * 0.6) / COUNT)),
        reach: 90 + Math.random() * 150,
        size: 6 + Math.random() * 8,
        color: palette[i % palette.length],
        delay: Math.random() * 0.18,
        drift: (Math.random() - 0.5) * 40,
      })),
    // New positions for every burst.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [burst],
  );

  useEffect(() => {
    if (burst === 0 || reduceMotion) return;
    if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    t.value = 0;
    t.value = withTiming(1, { duration: 1500, easing: Easing.linear });
  }, [burst, reduceMotion, t]);

  if (burst === 0 || reduceMotion) return null;
  return (
    <View style={styles.origin} pointerEvents="none">
      {sparks.map((spark, i) => (
        <SparkDot key={`${burst}-${i}`} spark={spark} t={t} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  origin: { position: 'absolute', left: '50%', top: 4, width: 0, height: 0, zIndex: 5 },
  spark: { position: 'absolute', left: 0, top: 0 },
});
