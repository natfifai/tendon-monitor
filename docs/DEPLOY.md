# Deployment Guide

How to get updates from your code into the hands of users.

## Three Kinds Of Deployments

**1. Web app change (text, colors, new feature, bug fix)**
Push to GitHub. Vercel auto deploys. iOS app picks up the new web content the next time it launches (Capacitor runs a local web server inside the app, but the content can be configured to fetch fresh from Vercel).

**2. Backend change (database schema, edge function)**
Run Supabase CLI commands. Takes a few minutes.

**3. Native iOS change (app icon, permissions, native plugins)**
Requires rebuild in Xcode and resubmission to App Store. Takes hours to days because of Apple review.

## Web App Updates

Most of your changes fall here. Flow:

1. Edit code locally or through Claude Code
2. Test with `npm run dev`
3. `git commit -am "describe the change"`
4. `git push`
5. Vercel deploys automatically within a minute
6. Users see the update next time they open the app (force close and reopen if needed)

## Backend Updates

**Schema changes:**

Write a new migration file in `backend/supabase/migrations/`, numbered sequentially. Example: `004_add_device_notes.sql`. Then:

```bash
cd backend/supabase
supabase db push
```

**Edge function changes:**

```bash
supabase functions deploy process-vibration
supabase functions deploy device-command
```

Individual functions take 30 seconds or so to deploy.

**Config changes (thresholds, colors, text):**

Don't touch code. Just open the admin panel, change values, save. The app picks up changes in real time.

## Native iOS Updates

You only need to do this when:

- Changing the app icon
- Changing splash screen
- Adding new native plugins (camera, bluetooth, etc)
- Updating Capacitor plugin versions
- Changing privacy strings in Info.plist
- Changing the app's bundle ID or version

Flow:

1. Make the native change
2. `npm run build && npx cap sync ios`
3. Open Xcode
4. Increment the build number in the project settings
5. Product > Archive
6. Upload to App Store Connect
7. Submit for review
8. Wait 1 to 3 days for Apple

## Safe Deployment Practices

- Test locally with demo mode on before shipping
- Use feature flags in the config table to roll out new features gradually
- Keep the admin panel password strong. Anyone with Supabase access can edit runtime config
- Before pushing backend changes, take a database backup in Supabase dashboard
- Version your builds semantically: 1.0.0 for initial release, 1.0.1 for fixes, 1.1.0 for features

## Rollback

**Vercel:** every deployment is preserved. In the Vercel dashboard, click a previous deployment and promote it to production.

**Supabase functions:** redeploy an older version from git.

**Supabase schema:** restore from backup (Supabase dashboard > Database > Backups).

**iOS:** you cannot rollback an App Store release. You have to submit a new build with the old behavior and wait for review. For this reason, be extra cautious with native changes.

## Environment Strategy

Recommended:

- **local** — your dev machine, `.env` with local or dev Supabase
- **staging** — separate Supabase project and Vercel preview URL, for testing before production
- **production** — main branch, real Supabase project, published App Store app

Vercel preview URLs are automatic for every branch. Use them to test changes before merging to main.
