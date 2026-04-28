# Setup Guide

Step by step instructions for getting the Tendon Monitor project running from scratch.

## What You Need Before Starting

- A Mac (required for iOS development)
- Node.js 18 or newer
- Xcode 15 or newer (from the Mac App Store)
- An Apple Developer account ($99/year at developer.apple.com) when ready to publish
- A GitHub account
- A Supabase account (free tier works)
- A Builder.io account (free tier works, optional, only needed for server driven UI)
- A Vercel account (free tier works) for hosting

## Step 1: Clone And Install

```bash
git clone YOUR_REPO_URL tendon-monitor
cd tendon-monitor/web-app
npm install
```

## Step 2: Set Up Supabase

1. Go to supabase.com, create a new project. Note the URL and anon key.
2. In the project dashboard, go to SQL Editor.
3. Run the three migration files in order, from `backend/supabase/migrations/`:
   - `001_initial_schema.sql`
   - `002_rls_policies.sql`
   - `003_realtime.sql`
4. Go to Project Settings, then Functions, and set these secrets:
   - `DEVICE_AUTH_TOKEN` — generate with `openssl rand -hex 32`
   - `CLASSIFIER_URL` — URL to your AI model endpoint (ask the person building the classifier)
   - `CLASSIFIER_API_KEY` — auth key for the classifier if it needs one

## Step 3: Deploy The Edge Functions

Install the Supabase CLI:

```bash
npm install -g supabase
supabase login
```

Link your project:

```bash
cd backend/supabase
supabase link --project-ref YOUR_PROJECT_REF
```

Deploy:

```bash
supabase functions deploy process-vibration
supabase functions deploy device-command
```

## Step 4: Configure The Web App

Copy the env template and fill it in:

```bash
cd web-app
cp .env.example .env
```

Edit `.env`:

```
VITE_SUPABASE_URL=https://yourproject.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...
VITE_BUILDER_API_KEY=your_builder_key
VITE_DEMO_MODE=false
```

If you're not using Builder.io yet, leave `VITE_BUILDER_API_KEY` empty. The app will fall back to the default layout.

## Step 5: Run In Dev Mode

```bash
npm run dev
```

Open http://localhost:5173. You should see the app. Click Record. If Supabase is connected but no device is sending data, readings stay empty. Enable demo mode in `.env` to test without a device:

```
VITE_DEMO_MODE=true
```

## Step 6: Set Up The Admin Panel

The admin panel is a static HTML file. You can host it anywhere. Options:

**Vercel (recommended):** add `admin-panel/` as a separate deployment. Or serve it from a subpath of the main app.

**Local:** just open `admin-panel/index.html` in a browser. It prompts for Supabase URL and key, stores them in localStorage.

## Step 7: Set Up The Device

See `device-firmware/README.md`. In short, configure the device with:
- Your WiFi SSID and password
- The `DEVICE_AUTH_TOKEN` you set in step 2
- The Supabase URL

Then flash the firmware. When the device starts, it polls for commands and sends samples when instructed.

## Step 8: Set Up The iOS Project

From `web-app/`:

```bash
npm run build
npx cap add ios
npx cap sync ios
npx cap open ios
```

This opens Xcode. First time setup in Xcode:

1. Select the project in the sidebar
2. Under Signing & Capabilities, select your Apple Developer team
3. Change the bundle identifier if needed (defaults to `com.yourcompany.tendonmonitor`)
4. Connect an iPhone via USB, select it as the run target
5. Press Cmd+R to build and run

See `ios-config/Info.plist.additions` for extra plist entries you may need.

## Step 9: Deploy To Vercel

Push the project to GitHub, then import it in Vercel. Set the root directory to `web-app/`. Add the environment variables from step 4. Vercel will auto deploy on every push to main.

## Step 10: Publish To The App Store

See `APP_STORE.md`.

## Troubleshooting

**"Missing VITE_SUPABASE_URL" warning in console.** Check your `.env` file is present and values are correct.

**Realtime updates not working.** Make sure migration 003 was run. Also check Project Settings > API > Realtime is enabled.

**Device commands not being picked up.** Check that `DEVICE_AUTH_TOKEN` matches in both places. Check device logs to see if polling is working.

**Classifier returns garbage frequencies.** The fallback FFT in the edge function is very simple. If you don't have a real classifier yet, test with known sine waves first.

**iOS build fails with signing error.** Make sure your Apple Developer account is added in Xcode preferences. Automatic signing should work for most cases.
