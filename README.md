# Lumen

A small habit app built around tactile, hand-tuned motion. Each habit is a light: hold it to switch it on.

**[Try it live](https://lumen-habits.vercel.app)** (best on a phone)

Built with React Native, Expo, Reanimated, Gesture Handler and react-native-svg. Runs on iOS, Android and the web.

## What's in it

- **Hold to light.** A progress ring fills while you hold a habit. Let go early and it springs back; finish the hold and the card lights up in its own color with a haptic tap and a drawn check.
- **Rolling streaks.** Streak counts roll like an odometer in the direction they change.
- **A week of rings.** Seven small rings fill in on load, and today's follows the habits you light.
- **Add a habit from a sheet.** It rises on a spring and you can drag it away. Past its resting point it resists like elastic.
- **A burst when the day is done.** Lighting the last habit scatters the day's lights from the progress bar.
- **It remembers.** Habits are saved on the device. A new day switches every light off, and a habit you skipped loses its streak.
- **A breathing splash.** One warm dot breathes, swells to fill the screen, and clears to reveal the day.
- **Respects Reduce Motion.** With the system setting on, animations are swapped for instant state changes.

## Run it

```sh
npm install
npx expo start        # press i, a or w
npx expo export --platform web   # static web build in dist/
```
