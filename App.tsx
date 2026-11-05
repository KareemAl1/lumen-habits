import { useCallback, useEffect, useMemo, useState } from 'react';
import { AccessibilityInfo, ScrollView, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { HabitCard } from './src/components/HabitCard';
import { Splash } from './src/components/Splash';
import { initialHabits } from './src/data';
import { colors, hues } from './src/theme';

function useReduceMotion() {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduce);
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduce);
    return () => sub.remove();
  }, []);
  return reduce;
}

const greeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
};

export default function App() {
  const reduceMotion = useReduceMotion();
  const [showSplash, setShowSplash] = useState(true);
  const [habits, setHabits] = useState(initialHabits);

  const toggle = useCallback((id: string) => {
    setHabits((list) =>
      list.map((h) => (h.id === id ? { ...h, done: !h.done, streak: h.streak + (h.done ? -1 : 1) } : h)),
    );
  }, []);

  const doneCount = habits.filter((h) => h.done).length;
  const progress = useSharedValue(0);
  useEffect(() => {
    const target = doneCount / habits.length;
    progress.value = reduceMotion ? target : withTiming(target, { duration: 700, easing: Easing.bezier(0.16, 1, 0.3, 1) });
  }, [doneCount, habits.length, progress, reduceMotion]);

  const barStyle = useAnimatedStyle(() => ({ width: `${progress.value * 100}%` }));
  const date = useMemo(
    () => new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }),
    [],
  );

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.date}>{date}</Text>
        <Text style={styles.title}>{greeting()}</Text>
        <View style={styles.summary}>
          <Text style={styles.summaryText}>
            {doneCount === habits.length ? 'Every light is on today.' : `${doneCount} of ${habits.length} lit today`}
          </Text>
          <View style={styles.track}>
            <Animated.View style={[styles.bar, barStyle]} />
          </View>
        </View>
        <View style={styles.list}>
          {habits.map((h, i) => (
            <HabitCard key={h.id} habit={h} index={i} onToggle={toggle} reduceMotion={reduceMotion} />
          ))}
        </View>
        <Text style={styles.footnote}>Hold a habit to light it. Hold again to undo.</Text>
      </ScrollView>
      {showSplash && !reduceMotion && <Splash onDone={() => setShowSplash(false)} />}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.paper },
  scroll: { paddingHorizontal: 20, paddingTop: 72, paddingBottom: 48, maxWidth: 520, width: '100%', alignSelf: 'center' },
  date: { fontSize: 13, color: colors.mute, textTransform: 'uppercase', letterSpacing: 1 },
  title: { fontSize: 34, fontWeight: '700', color: colors.ink, letterSpacing: -0.8, marginTop: 4 },
  summary: { marginTop: 22, marginBottom: 22, gap: 10 },
  summaryText: { fontSize: 15, color: colors.ink },
  track: { height: 8, borderRadius: 4, backgroundColor: colors.line, overflow: 'hidden' },
  bar: { height: 8, borderRadius: 4, backgroundColor: hues.amber.base },
  list: { gap: 12 },
  footnote: { marginTop: 22, textAlign: 'center', fontSize: 13, color: colors.mute },
});
