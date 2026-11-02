# BodaLink Mobile (Expo)

React Native / Expo Router app with native `StyleSheet` styling (no Tailwind). The welcome screen follows the provided BodaLink mockup: original website motorcycle hero image, dark overlay, white/yellow typography, prominent Log in and Create an Account buttons, and rider-service benefits.

## Setup

1. Ensure MySQL is running and the existing `bodalink` database/schema is present.
2. From the root folder, run `npm install`, then `npm run dev:all`. The website remains on port 3001 and the added mobile JSON API runs on port 3002.
3. Copy `.env.example` to `.env`. Set `EXPO_PUBLIC_API_URL` to the computer's LAN IP, e.g. `http://192.168.100.36:3002/api`. Update the IP if your computer's address changes. Do not use `localhost` from a physical phone.
4. In a new terminal, run `cd mobile`, `npm install`, and `npx expo start`. Scan the QR with an Expo Go version compatible with this SDK.
5. If Expo reports native dependency mismatches, run `npx expo install --fix`.

Features: phone/password signup and login, rider availability, booking and fare estimate, trip history/completion, profile and logout. The app uses the same MySQL tables as the website through `mobile-api/server.js`.

The mobile API is additive and does not edit the original `server.js`. This project is pinned to SDK 57 as requested. Note that Expo SDK 58 was released on October 15, 2026, so the Expo Go installed from the app store may target SDK 58; if it rejects SDK 57, use a compatible SDK 57 Expo Go build or ask to upgrade this project to SDK 58. It stores bearer tokens in memory for this development build; restarting the API logs mobile users out. Before public production deployment, use expiring persistent tokens, HTTPS, restricted CORS, rate limits and proper environment secrets. The fare rate defaults to KSh 50/km; set `FARE_PER_KM` if needed.


The landing screen is built from native React Native components to match the approved dark cinematic BodaLink design. The dedicated `assets/bodalink-hero.jpg` is used only as the photographic backdrop; headings, buttons, benefit labels, and navigation remain real UI elements. Log In and Create Account are separate, visible actions.
