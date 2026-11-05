import { useEffect } from 'react';
import { StyleSheet, Text } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withSequence, withTiming } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { colors, hues } from '../theme';

// A single warm dot breathes once, swells to fill the screen, then clears to
// reveal the day underneath.
export function Splash({ onDone }: { onDone: () => void }) {
  const dot = useSharedValue(0);
  const fade = useSharedValue(1);
  const word = useSharedValue(0);

  useEffect(() => {
    const soft = Easing.bezier(0.16, 1, 0.3, 1);
    word.value = withDelay(150, withTiming(1, { duration: 500, easing: soft }));
    dot.value = withSequence(
      withTiming(1, { duration: 520, easing: soft }),
      withTiming(0.85, { duration: 260, easing: Easing.inOut(Easing.quad) }),
      withTiming(40, { duration: 700, easing: Easing.bezier(0.7, 0, 0.84, 0) }),
    );
    fade.value = withDelay(1350, withTiming(0, { duration: 420 }, (finished) => {
      if (finished) scheduleOnRN(onDone);
    }));
  }, [dot, fade, word, onDone]);

  const wrap = useAnimatedStyle(() => ({ opacity: fade.value }));
  const dotStyle = useAnimatedStyle(() => ({ transform: [{ scale: dot.value }] }));
  const wordStyle = useAnimatedStyle(() => ({
    opacity: word.value * (dot.value > 2 ? 0 : 1),
    transform: [{ translateY: (1 - word.value) * 10 }],
  }));

  return (
    <Animated.View style={[StyleSheet.absoluteFill, styles.wrap, wrap]} pointerEvents="none">
      <Animated.View style={[styles.dot, dotStyle]} />
      <Animated.View style={wordStyle}>
        <Text style={styles.word}>lumen</Text>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { backgroundColor: colors.paper, alignItems: 'center', justifyContent: 'center', zIndex: 10 },
  dot: { width: 44, height: 44, borderRadius: 22, backgroundColor: hues.amber.base, marginBottom: 18 },
  word: { fontSize: 22, fontWeight: '600', letterSpacing: -0.4, color: colors.ink },
});
