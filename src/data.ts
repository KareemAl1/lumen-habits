export type Habit = {
  id: string;
  name: string;
  detail: string;
  hue: keyof typeof import('./theme').hues;
  streak: number;
  done: boolean;
};

export const initialHabits: Habit[] = [
  { id: 'water', name: 'Drink water', detail: '8 glasses', hue: 'sky', streak: 12, done: false },
  { id: 'walk', name: 'Evening walk', detail: '30 minutes', hue: 'amber', streak: 5, done: false },
  { id: 'read', name: 'Read', detail: '20 pages', hue: 'rose', streak: 21, done: true },
  { id: 'stretch', name: 'Stretch', detail: '10 minutes', hue: 'mint', streak: 3, done: false },
];
