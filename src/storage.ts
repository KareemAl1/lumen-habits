import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Habit } from './data';
import { hues } from './theme';

const KEY = 'lumen.habits.v1';

type Saved = { day: string; habits: Habit[] };

const today = () => new Date().toDateString();

const isHabit = (h: unknown): h is Habit => {
  const x = h as Habit;
  return !!x && typeof x.id === 'string' && typeof x.name === 'string' && typeof x.detail === 'string'
    && typeof x.streak === 'number' && typeof x.done === 'boolean' && x.hue in hues;
};

// Habits come back as you left them. On a new day every light starts off
// again, and a habit that wasn't lit yesterday loses its streak.
export async function loadHabits(): Promise<Habit[] | null> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return null;
    const saved = JSON.parse(raw) as Saved;
    if (!Array.isArray(saved.habits) || !saved.habits.every(isHabit) || saved.habits.length === 0) return null;
    if (saved.day === today()) return saved.habits;
    return saved.habits.map((h) => ({ ...h, done: false, streak: h.done ? h.streak : 0 }));
  } catch {
    return null;
  }
}

export function saveHabits(habits: Habit[]) {
  const saved: Saved = { day: today(), habits };
  AsyncStorage.setItem(KEY, JSON.stringify(saved)).catch(() => {});
}
