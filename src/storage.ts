import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Habit } from './data';
import { hues } from './theme';

const KEY = 'lumen.habits.v1';

/** How full each day was, by date, for the last two weeks. */
export type History = Record<string, number>;
type Saved = { day: string; habits: Habit[]; history?: History };

const today = () => new Date().toDateString();

/** A date as YYYY-MM-DD in local time, the key the week strip looks days up by. */
export const dayKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

let history: History = {};
const isHistory = (h: unknown): h is History =>
  !!h && typeof h === 'object' && Object.values(h).every((v) => typeof v === 'number' && v >= 0 && v <= 1);

/** Days recorded so far. Empty until the first visit has been saved. */
export const getHistory = (): History => ({ ...history });

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
    if (isHistory(saved.history)) history = saved.history;
    if (saved.day === today()) return saved.habits;
    return saved.habits.map((h) => ({ ...h, done: false, streak: h.done ? h.streak : 0 }));
  } catch {
    return null;
  }
}

// Each save also records how much of today is lit, and forgets days older than two weeks.
export function saveHabits(habits: Habit[]) {
  const now = new Date();
  history[dayKey(now)] = habits.length ? habits.filter((h) => h.done).length / habits.length : 0;
  const cutoff = dayKey(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 14));
  for (const k of Object.keys(history)) if (k < cutoff) delete history[k];
  const saved: Saved = { day: today(), habits, history };
  AsyncStorage.setItem(KEY, JSON.stringify(saved)).catch(() => {});
}
