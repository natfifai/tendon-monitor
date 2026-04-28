# Tendon Vibration Monitor — Project Guide for Claude Code

## Project Summary

An iOS app that connects to a physical hardware device via WiFi. The device captures tendon vibration data, sends it to a backend where an AI model classifies it into a dominant frequency (0 to 999,999 Hz), and the app displays the results in real time.

The app is built as a web app and wrapped for iOS using Capacitor. This allows rapid updates without App Store resubmissions for most changes.

## Core Features

1. Ring visualization at the top of the screen showing the most recent frequency reading. Red for low, green for high, smooth gradient between. Styled like an Apple Fitness ring.
2. Bar chart in the middle of the screen showing the last 5 readings with matching color coding.
3. Record and Stop buttons at the bottom to control data capture from the device.
4. Real time updates via Supabase realtime subscriptions.
5. Server driven UI via Builder.io so layout changes can be made without redeploying.
6. Admin panel for editing configuration values (thresholds, colors, ranges).

## Tech Stack

- **Frontend framework**: React with Vite
- **Styling**: Tailwind CSS
- **Charts**: SVG for ring, Chart.js for bar chart
- **Backend**: Supabase (Postgres, realtime, edge functions, auth)
- **Server driven UI**: Builder.io
- **iOS wrapper**: Capacitor
- **Hosting**: Vercel (auto deploys from GitHub)
- **Device communication**: HTTP POST from device to Supabase edge function

## Architecture

```
[Hardware Device] --WiFi POST--> [Supabase Edge Function]
                                         |
                                         v
                                 [AI Classifier]
                                         |
                                         v
                                 [Supabase Database]
                                         |
                                         v (realtime subscription)
                                 [React Web App]
                                         |
                                         v (Capacitor bridge)
                                 [iOS App]
```

## File Structure

```
tendon-monitor/
  CLAUDE.md                           this file
  README.md                           setup instructions for humans
  web-app/                            the React web application
    package.json
    vite.config.js
    tailwind.config.js
    capacitor.config.ts
    src/
      App.jsx                         main app shell
      main.jsx                        entry point
      index.css                       tailwind setup
      components/
        FrequencyRing.jsx             the ring visualization
        BarChart.jsx                  last 5 readings chart
        RecordControls.jsx            record and stop buttons
        StatusBar.jsx                 connection status indicator
      services/
        supabase.js                   supabase client setup
        builderSetup.js               builder.io setup
        deviceCommands.js             sending start and stop to device
      sdui/
        ComponentRegistry.jsx         registers components with builder.io
        LayoutRenderer.jsx            fetches and renders builder.io content
      hooks/
        useReadings.js                subscribes to realtime readings
        useRecording.js               manages recording state
        useConfig.js                  fetches app config from supabase
    public/
    ios-config/
      Info.plist.additions            privacy strings for iOS
  backend/
    supabase/
      migrations/
        001_initial_schema.sql        database tables
        002_rls_policies.sql          row level security
        003_realtime.sql              realtime setup
      functions/
        process-vibration/            edge function for incoming data
          index.ts
        device-command/               edge function for commanding device
          index.ts
  admin-panel/
    index.html                        simple admin page
    admin.js                          admin logic
  device-firmware/
    esp32-template.ino                reference firmware for ESP32
    README.md                         how the device talks to the backend
  docs/
    SETUP.md                          step by step setup guide
    DEPLOY.md                         deployment walkthrough
    BUILDER_SETUP.md                  builder.io configuration guide
    APP_STORE.md                      app store submission checklist
```

## Important Conventions

- Use functional React components with hooks. No class components.
- Color scheme: red (low frequency) through amber (mid) to green (high). This is intentional and inverted from conventional red equals danger. High frequency is good in this context.
- The frequency range is configurable through the admin panel. Default max is 2000 Hz because real tendon vibrations fall within this range, but the system accepts values up to 999,999 Hz.
- Never put secrets in the code. Use environment variables.
- All user facing text should come from the config table in Supabase so it can be edited without a redeploy.
- Avoid the word "medical" anywhere in user facing copy or App Store metadata. Apple requires medical device documentation if the app claims medical purpose.
- Include a demo mode that generates fake readings. Apple reviewers need this to test the app without the physical device.

## Development Commands

From `web-app/` directory:

```
npm install                           install dependencies
npm run dev                           start dev server at localhost:5173
npm run build                         build for production
npm run preview                       preview production build
npx cap sync ios                      sync web build into iOS project
npx cap open ios                      open Xcode
```

From `backend/supabase/`:

```
supabase start                        start local supabase
supabase db push                      apply migrations to remote
supabase functions deploy             deploy edge functions
```

## Environment Variables

Create `.env` in `web-app/` with:

```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_BUILDER_API_KEY=your_builder_key
```

## Testing the Full Flow

1. Start Supabase locally or use cloud instance
2. Run `npm run dev` in `web-app/`
3. Open admin panel, verify config loads
4. Click Record, verify demo mode generates readings
5. Verify ring updates, bar chart updates, colors shift correctly
6. Test with real device by deploying edge functions and pointing device at the URL

## Known Gotchas

- Capacitor requires running `npx cap sync` every time the web build changes
- Supabase realtime requires the table to be added to the realtime publication explicitly (handled in 003_realtime.sql)
- Builder.io components must be registered before the app renders or layouts will fail silently
- iOS requires a privacy policy URL in App Store Connect even if the app does not collect data
- If the device sends data over HTTP (not HTTPS) you will need App Transport Security exceptions in Info.plist

## What Claude Code Should Focus On

When asked to make changes:

1. Always read this file first
2. Check the relevant file in the structure above
3. Keep the separation between presentation (components), logic (hooks), and services (external APIs)
4. Update docs when adding features
5. Test that the demo mode still works after any change to the data flow
6. Never break the ability to run without the hardware device connected

## Human Only Tasks

These cannot be done by Claude Code and require a human:

- Creating Apple Developer account
- Installing Xcode on a Mac
- Signing certificates and provisioning profiles
- Submitting to App Store Connect
- Responding to App Store review feedback
- Creating Builder.io account and getting API key
- Creating Supabase project and getting keys
- Buying a domain if a custom one is desired
