# BodaLink: Website + Mobile App

This project contains the existing BodaLink website and the Expo React Native mobile app. The website's original `server.js` is preserved. The mobile app has its own API process, and both server processes connect to the same MySQL database so the website and mobile app share riders, users, and trip data.

## Project structure

- `server.js` — existing website server (port 3001)
- `views/`, `public/` — existing EJS pages, CSS, and website images
- `mobile-api/server.js` — mobile app API (port 3002)
- `mobile/` — Expo React Native app
- `public/Images/hero.jpg` — original website homepage hero image
- `mobile/assets/bodalink-hero.jpg` — same hero image copied for the mobile homepage

The mobile welcome screen follows the reference mockup: the website's actual `hero.jpg` image, dark overlay, white text, yellow highlights, brand header, large headline, benefits row, and clearly visible Log in and Create an Account controls. These are real native buttons; the welcome screen is not a flattened screenshot. The buttons remain native, functional controls rather than being part of a flattened screenshot.

## One-time setup

1. Install Node.js and make sure MySQL is running.
2. In a terminal at the project root, run `npm install`.
3. Check the database connection settings at the top of `server.js` and `mobile-api/server.js`. Both must point to the same BodaLink database.
4. Open `mobile/.env` (create it by copying `.env.example`) and set `EXPO_PUBLIC_API_URL` to your computer's LAN IP and port 3002, for example `EXPO_PUBLIC_API_URL=http://192.168.100.36:3002/api`. Use your computer's current IP; the example may change.
5. Run `npm install` inside `mobile/` once.

## Run website and mobile app concurrently

You need **two terminal windows**. Keep both running.

### Terminal 1 — website and mobile API

From the project root:

```bash
npm run dev:all
```

This starts the existing website on port 3001 and the mobile API on port 3002. Do not close this terminal while using the mobile app.

### Terminal 2 — Expo mobile app

From the project root:

```bash
cd mobile
npx expo start
```

Scan the QR code using a compatible Expo Go app or run on an appropriate development build. Your phone and computer should be on the same Wi-Fi network. If Expo Go does not support this SDK version yet, use a compatible development build or SDK-supported Expo Go version.

## Test the connection

- Open the website at `http://localhost:3001` on the computer.
- Open the mobile app on your phone from Expo.
- Log in or create an account, then check riders and trip data in both apps.
- On a phone, the API URL must use the computer's LAN IP, not `localhost`, because `localhost` on the phone refers to the phone itself.

The mobile app and website use separate interfaces but share the database through their server processes. Avoid running a second copy of either server on the same port.
