# BodaLink deployment notes

## Services

This repository is configured for two Render web services from the same repository:

- `bodalink-web`: `npm ci` then `npm start`; health check `/healthz`.
- `bodalink-api`: `npm ci` then `npm run start:api`; health check `/api/health`.

Both services use the same Aiven MySQL database and the same root `package.json`. Render Blueprint settings are in `render.yaml`. The free plan may sleep when idle and is not an always-on production guarantee.

## Render environment variables

Set these values in both services (Render prompts for values marked `sync: false`):

- `NODE_ENV=production`
- `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` from Aiven
- `DB_CA_CERT`: paste the full contents of the Aiven CA certificate (`ca.pem`) as a multiline secret value
- `FARE_PER_KM=50` (or the fare rate configured for the business)

Additionally set on `bodalink-web`:

- `SESSION_SECRET`: a long, random, unique secret
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` for durable profile-photo uploads

The website uses a MySQL-backed session store (`web_sessions`). The API uses database-backed token hashes (`api_tokens`). The schema includes both tables; the website also creates `web_sessions` automatically.

## Cloudinary profile images

Production profile uploads use Cloudinary. Without the three Cloudinary variables, the website intentionally refuses to start rather than silently saving profile images to Render's temporary filesystem. Existing local files in `public/uploads` are excluded from this deployment archive; existing database profile-photo filenames must be migrated to Cloudinary if those photos need to remain visible.

## Expo Android APK

The Expo app reads `EXPO_PUBLIC_API_URL`. Set it in `mobile/.env` to the deployed API base URL, including `/api`, for example `https://bodalink-api.onrender.com/api`. If Render assigns a different hostname, use that exact hostname. The same URL is used as the fallback in `mobile/lib/api.ts`.

The `mobile/eas.json` preview profile is configured to create an installable Android APK. From the `mobile` directory, install/use EAS CLI, log in to the Expo account, run `eas build:configure` if prompted, then run `eas build --platform android --profile preview`. EAS may add a project ID to `mobile/app.json`; keep that generated ID.

## Local development

Copy `.env.example` to `.env`, fill in local or Aiven credentials, and keep `NODE_ENV=development`. The app uses `certificates/ca.pem` locally when `DB_CA_CERT` is not set. Copy `mobile/.env.example` to `mobile/.env` and set `EXPO_PUBLIC_API_URL` to the local API address when testing on a phone.

Never commit `.env`, `certificates/`, `public/uploads/`, or database exports. The deployment ZIP intentionally omits these private/local files.
