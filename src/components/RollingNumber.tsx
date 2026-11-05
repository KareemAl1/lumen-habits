import { useEffect, useState } from 'react';
import { StyleSheet, Text, View, type TextStyle } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

type Props = { value: number; style: TextStyle; reduceMotion: boolean };

// A number that rolls like an odometer: the old value slides out in the
// direction of change while the new one slides in from the other side.
export function RollingNumber({ value, style, reduceMotion }: Props) {
  const [shown, setShown] = useState({ current: value, previous: value });
  const dir = useSharedValue(1);
  const t = useSharedValue(1);
  const height = (style.fontSize ?? 16) * 1.25;

  useEffect(() => {
    if (value === shown.current) return;
    dir.value = value > shown.current ? 1 : -1;
    setShown({ current: value, previous: shown.current });
    if (reduceMotion) return;
    t.value = 0;
    t.value = withTiming(1, { duration: 480, easing: Easing.bezier(0.16, 1, 0.3, 1) });
  }, [value, shown, reduceMotion, t, dir]);

  const incoming = useAnimatedStyle(() => ({
    opacity: t.value,
    transform: [{ translateY: (1 - t.value) * height * dir.value }],
  }));
  const outgoing = useAnimatedStyle(() => ({
    opacity: 1 - t.value,
    transform: [{ translateY: -t.value * height * dir.value }],
  }));

  return (
    <View style={{ height, overflow: 'hidden' }}>
      {shown.previous !== shown.current && (
        <Animated.View style={[StyleSheet.absoluteFill, outgoing]} aria-hidden>
          <Text style={[style, styles.right]}>{shown.previous}</Text>
        </Animated.View>
      )}
      <Animated.View style={incoming}>
        <Text style={[style, styles.right]}>{shown.current}</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({ right: { textAlign: 'right', lineHeight: undefined } });
