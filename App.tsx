import { useCallback, useEffect, useMemo, useState } from 'react';
import { AccessibilityInfo, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { AddHabitSheet } from './src/components/AddHabitSheet';
import { HabitCard } from './src/components/HabitCard';
import { Splash } from './src/components/Splash';
import { WeekStrip } from './src/components/WeekStrip';
import { initialHabits, type Habit } from './src/data';
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

// On the web, a long press normally selects text or opens the browser's
// callout menu, which interrupts the hold. Turn those off for the app.
function useWebHoldFix() {
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;
    const style = document.createElement('style');
    style.textContent =
      '*{-webkit-user-select:none;user-select:none;-webkit-touch-callout:none;-webkit-tap-highlight-color:transparent}';
    document.head.appendChild(style);
    const block = (e: Event) => e.preventDefault();
    document.addEventListener('contextmenu', block);
    document.addEventListener('selectstart', block);
    return () => {
      style.remove();
      document.removeEventListener('contextmenu', block);
      document.removeEventListener('selectstart', block);
    };
  }, []);
}

export default function App() {
  useWebHoldFix();
  const reduceMotion = useReduceMotion();
  const [showSplash, setShowSplash] = useState(true);
  const [habits, setHabits] = useState(initialHabits);

  const toggle = useCallback((id: string) => {
    setHabits((list) =>
      list.map((h) => (h.id === id ? { ...h, done: !h.done, streak: h.streak + (h.done ? -1 : 1) } : h)),
    );
  }, []);
  const [sheetOpen, setSheetOpen] = useState(false);
  const addHabit = useCallback((h: { name: string; detail: string; hue: Habit['hue'] }) => {
    setHabits((list) => [...list, { ...h, id: `${Date.now()}`, streak: 0, done: false }]);
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
    <GestureHandlerRootView style={styles.root}>
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
        <WeekStrip today={doneCount / habits.length} reduceMotion={reduceMotion} />
        <Text style={styles.section}>Today</Text>
        <View style={styles.list}>
          {habits.map((h, i) => (
            <HabitCard key={h.id} habit={h} index={i} onToggle={toggle} reduceMotion={reduceMotion} />
          ))}
        </View>
        <Pressable
          onPress={() => setSheetOpen(true)}
          style={({ pressed }) => [styles.newHabit, pressed && styles.newHabitPressed]}
          accessibilityRole="button"
        >
          <Text style={styles.newHabitPlus}>+</Text>
          <Text style={styles.newHabitText}>New habit</Text>
        </Pressable>
        <Text style={styles.footnote}>Hold a habit to light it. Hold again to undo.</Text>
      </ScrollView>
      <AddHabitSheet open={sheetOpen} onClose={() => setSheetOpen(false)} onAdd={addHabit} reduceMotion={reduceMotion} />
      {showSplash && !reduceMotion && <Splash onDone={() => setShowSplash(false)} />}
    </GestureHandlerRootView>
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
  section: { marginTop: 26, marginBottom: 10, fontSize: 13, color: colors.mute, textTransform: 'uppercase', letterSpacing: 1 },
  list: { gap: 12 },
  newHabit: {
    marginTop: 12,
    height: 56,
    borderRadius: 22,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.line,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  newHabitPressed: { backgroundColor: colors.card, transform: [{ scale: 0.98 }] },
  newHabitPlus: { fontSize: 20, color: colors.mute, marginTop: -2 },
  newHabitText: { fontSize: 15, fontWeight: '600', color: colors.mute },
  footnote: { marginTop: 22, textAlign: 'center', fontSize: 13, color: colors.mute },
});
