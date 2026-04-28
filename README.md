# Tendon Vibration Monitor

iOS app that pairs with a hardware device to measure tendon vibrations via an AI classifier. Built as a web app wrapped for iOS using Capacitor.

## Quick Start

1. Follow `docs/SETUP.md` for first time setup (Supabase, Builder.io, Vercel accounts)
2. Follow `docs/DEPLOY.md` to deploy
3. Follow `docs/APP_STORE.md` to publish to the App Store

## Project Structure

- `web-app/` — the React web application wrapped for iOS
- `backend/supabase/` — database schema and edge functions
- `admin-panel/` — simple page to edit configuration
- `device-firmware/` — reference firmware for the hardware device
- `docs/` — step by step guides

## Tech Stack

React, Vite, Tailwind, Supabase, Builder.io, Capacitor.

## For Claude Code

Read `CLAUDE.md` first. It contains everything needed to understand and modify this project.
