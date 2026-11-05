# Lumen

A small habit app built around tactile, hand-tuned motion. Each habit is a light: hold it to switch it on.

Built with React Native, Expo, Reanimated and react-native-svg. Runs on iOS, Android and the web.

## What's in it

- **Hold to light.** A progress ring fills while you hold a habit. Let go early and it springs back; finish the hold and the card lights up in its own color with a haptic tap and a drawn check.
- **Rolling streaks.** Streak counts roll like an odometer in the direction they change.
- **A breathing splash.** One warm dot breathes, swells to fill the screen, and clears to reveal the day.
- **Respects Reduce Motion.** With the system setting on, animations are swapped for instant state changes.

## Run it

```sh
npm install
npx expo start        # press i, a or w
npx expo export --platform web   # static web build in dist/
```
