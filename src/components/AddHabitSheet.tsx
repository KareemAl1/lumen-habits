import { useEffect, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import type { Habit } from '../data';
import { colors, hues } from '../theme';

type HueKey = Habit['hue'];
type Props = {
  open: boolean;
  onClose: () => void;
  onAdd: (habit: { name: string; detail: string; hue: HueKey }) => void;
  reduceMotion: boolean;
};

const SHEET = 380;
const spring = { damping: 22, stiffness: 220, mass: 0.9 };

const tap = () => {
  if (Platform.OS !== 'web') Haptics.selectionAsync();
};

function HueChip({ hue, selected, onPress }: { hue: HueKey; selected: boolean; onPress: () => void }) {
  const pop = useSharedValue(0);
  useEffect(() => {
    if (selected) pop.value = withSequence(withTiming(1, { duration: 110 }), withSpring(0, { damping: 9, stiffness: 240 }));
  }, [selected, pop]);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: 1 + pop.value * 0.18 }] }));
  return (
    <Pressable onPress={onPress} accessibilityRole="radio" accessibilityState={{ selected }} accessibilityLabel={hue}>
      <Animated.View style={[styles.chip, { backgroundColor: hues[hue].base }, selected && styles.chipOn, style]} />
    </Pressable>
  );
}

// A sheet that rises on a spring, follows your finger when you drag it down,
// and either settles back or slides away depending on how far and fast you let go.
export function AddHabitSheet({ open, onClose, onAdd, reduceMotion }: Props) {
  const y = useSharedValue(SHEET);
  const [mounted, setMounted] = useState(open);
  const [name, setName] = useState('');
  const [detail, setDetail] = useState('');
  const [hue, setHue] = useState<HueKey>('amber');

  useEffect(() => {
    if (open) {
      setMounted(true);
      y.value = reduceMotion ? 0 : withSpring(0, spring);
    } else if (mounted) {
      const done = () => setMounted(false);
      if (reduceMotion) {
        y.value = SHEET;
        done();
      } else {
        y.value = withTiming(SHEET, { duration: 260, easing: Easing.in(Easing.quad) }, (f) => {
          if (f) scheduleOnRN(done);
        });
      }
    }
  }, [open, mounted, reduceMotion, y]);

  const drag = Gesture.Pan()
    .activeOffsetY(8)
    .onChange((e) => {
      // Past the resting point the sheet resists, like pulling on elastic.
      const next = y.value + e.changeY;
      y.value = next < 0 ? next * 0.3 : next;
    })
    .onEnd((e) => {
      if (y.value > SHEET * 0.3 || e.velocityY > 900) scheduleOnRN(onClose);
      else y.value = withSpring(0, { ...spring, velocity: e.velocityY });
    });

  const sheetStyle = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }] }));
  const backdropStyle = useAnimatedStyle(() => ({ opacity: interpolate(y.value, [0, SHEET], [1, 0], 'clamp') }));

  const canAdd = name.trim().length > 0;
  const submit = () => {
    if (!canAdd) return;
    onAdd({ name: name.trim(), detail: detail.trim() || 'Every day', hue });
    setName('');
    setDetail('');
    onClose();
  };

  if (!mounted) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents={open ? 'auto' : 'none'}>
      <Animated.View style={[StyleSheet.absoluteFill, styles.backdrop, backdropStyle]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Close" />
      </Animated.View>
      <GestureDetector gesture={drag}>
        <Animated.View style={[styles.sheet, sheetStyle]} accessibilityViewIsModal>
          <View style={styles.grabber} />
          <Text style={styles.title}>New habit</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="What do you want to keep doing?"
            placeholderTextColor={colors.mute}
            style={styles.input}
            autoFocus={Platform.OS !== 'web'}
            returnKeyType="next"
            maxLength={32}
          />
          <TextInput
            value={detail}
            onChangeText={setDetail}
            placeholder="How much? e.g. 15 minutes"
            placeholderTextColor={colors.mute}
            style={styles.input}
            returnKeyType="done"
            onSubmitEditing={submit}
            maxLength={24}
          />
          <View style={styles.hues} accessibilityRole="radiogroup">
            {(Object.keys(hues) as HueKey[]).map((k) => (
              <HueChip key={k} hue={k} selected={k === hue} onPress={() => { tap(); setHue(k); }} />
            ))}
          </View>
          <Pressable
            onPress={submit}
            disabled={!canAdd}
            style={[styles.add, { backgroundColor: canAdd ? hues[hue].base : colors.line }]}
            accessibilityRole="button"
          >
            <Text style={[styles.addText, !canAdd && { color: colors.mute }]}>Add habit</Text>
          </Pressable>
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: { backgroundColor: 'rgba(28,27,25,0.28)' },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    maxWidth: 520,
    width: '100%',
    alignSelf: 'center',
    backgroundColor: colors.card,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 36,
    gap: 12,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: -6 },
  },
  grabber: { alignSelf: 'center', width: 40, height: 5, borderRadius: 3, backgroundColor: colors.line, marginBottom: 6 },
  title: { fontSize: 22, fontWeight: '700', color: colors.ink, letterSpacing: -0.4 },
  input: {
    height: 50,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.paper,
    paddingHorizontal: 14,
    fontSize: 16,
    color: colors.ink,
  },
  hues: { flexDirection: 'row', gap: 14, paddingVertical: 6 },
  chip: { width: 34, height: 34, borderRadius: 17, borderWidth: 3, borderColor: 'transparent' },
  chipOn: { borderColor: colors.ink },
  add: { height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  addText: { fontSize: 16, fontWeight: '700', color: '#fff' },
});
