# App Store Submission Checklist

What to do once the app is working and you want to publish it.

## Before You Start

You need:

- Apple Developer account (99 dollars per year, enrolled at developer.apple.com)
- Mac with Xcode 15 or newer
- The app tested on a real iPhone via USB
- A privacy policy URL (required by Apple even if you collect no data)
- App icon as 1024 by 1024 PNG, no transparency
- At least one set of screenshots for each device size you support

## Phase 1: Prepare The App

### App Icon

Create a 1024x1024 PNG with no transparency and no rounded corners (Apple adds them). Use a tool like appicon.co to generate all the sizes iOS needs, then drop them into the Xcode project under `ios/App/App/Assets.xcassets/AppIcon.appiconset/`.

### Splash Screen

Capacitor generates a default. To customize, use `@capacitor/assets`:

```bash
npm install -g @capacitor/assets
npx capacitor-assets generate --ios
```

Put a 2732x2732 PNG at `assets/splash.png` and a 1024x1024 at `assets/icon.png`, then run the command above.

### Bundle Identifier

In Xcode, select the project, then the target, then General. Set the bundle identifier to something unique and reverse-domain style, like `com.yourname.tendonmonitor`. This has to match what you register in App Store Connect.

### Version And Build Numbers

In the same General tab:

- Version: user-facing version like 1.0.0
- Build: internal number, increment every submission (1, 2, 3, ...)

### Test On A Real Device

Connect your iPhone via USB. In Xcode, select it as the run target. Press Cmd+R. The app should install and run. Test every feature: record, stop, ring animation, bar chart, offline behavior.

### Demo Mode

Make sure the app works without the hardware device connected. Apple reviewers will not have your device. The demo mode built into this project generates fake readings. Flip `VITE_DEMO_MODE=true` in a separate build configuration if needed, or include a settings toggle.

## Phase 2: App Store Connect Setup

### Create The App Record

Go to appstoreconnect.apple.com. Click My Apps, then the plus icon. Fill in:

- Platform: iOS
- Name: Tendon Monitor (or whatever)
- Primary Language: English US
- Bundle ID: select the one you configured in Xcode
- SKU: any unique string for your own reference
- User Access: Full Access

### App Information

- Category: Health and Fitness is the most natural fit. Avoid Medical unless you have documentation showing the app is a medical device, because that category requires extra review.
- Content Rights: confirm you own or have rights to use all content
- Age Rating: answer the questionnaire honestly. Most likely 4 plus.

### Pricing And Availability

- Price: free, or set a tier
- Availability: pick countries. Start with just your home country for the first release, expand later.

### App Privacy

This section is mandatory now. Be specific about what data you collect. For this app you likely collect:

- Device identifiers (for linking to the hardware)
- Usage data (readings)
- Diagnostics (crash reports if you enable them)

You don't collect name, email, or payment info unless you added auth.

### Version Information

For your 1.0.0 submission:

**Screenshots:** required sizes are 6.7 inch (iPhone 15 Pro Max) and 6.5 inch (iPhone 11 Pro Max), each 1290x2796 and 1242x2688 respectively. You can generate these from the simulator. Show the main screen with readings, the recording state, etc. 3 to 5 screenshots is typical.

**Promotional Text:** 170 chars, shows above the description, can be updated without resubmission.

**Description:** 4000 chars. Explain what the app does. Avoid medical claims. Something like: "Tendon Monitor pairs with your Tendon Monitor hardware device to track vibration frequency in real time. View the latest reading in a colorful ring, see your last 5 readings at a glance, and start or stop recording with one tap."

**Keywords:** 100 chars, comma separated. Examples: tendon, vibration, frequency, monitor, fitness, health.

**Support URL:** a page where users can get help. Could be a simple landing page or a GitHub issues link.

**Marketing URL:** optional, your website if you have one.

**Privacy Policy URL:** required. Generate one with a tool like termly.io or app-privacy-policy-generator.nisrulz.com. Host it somewhere public (your own site, GitHub Pages, or Notion). The policy should describe what data you collect and how it is used.

## Phase 3: Upload The Build

### Archive In Xcode

In Xcode, at the top bar, set the run target to "Any iOS Device (arm64)". Then:

- Product > Archive

This takes a few minutes. When done, the Organizer window opens.

### Validate

In Organizer, click your archive, then Validate App. This checks for common issues before upload. Fix any errors it finds.

### Distribute

Click Distribute App, choose App Store Connect, follow the prompts. Choose automatic signing unless you have a reason not to. The upload takes 5 to 15 minutes.

### Wait For Processing

Back in App Store Connect, the build appears under Activity within 10 to 30 minutes. Once its status is "Ready to Submit", go to your version page and select the build.

## Phase 4: Submit For Review

### Review Information

Apple asks for:

- Contact info: a phone and email they can reach you at
- Demo account: N A for this app since there's no login
- Notes: this is where you explain anything non obvious. For this app, write: "This app connects to our proprietary hardware device to measure tendon vibration frequency for personal fitness tracking. A demo mode is built in so reviewers can test the app without the physical device. To activate demo mode: [describe how]. This is not a medical device and makes no medical claims."

### Version Release

Pick manually or automatic release after approval. Manual is safer for a first release.

### Submit

Click Submit for Review.

## Phase 5: Review Process

Apple typically reviews within 1 to 3 days. Possible outcomes:

**Approved:** the app goes live in the App Store within a few hours (manual) or immediately (auto).

**Rejected:** Apple tells you why. Common reasons for a hardware-paired app:

- "We cannot test the app without the hardware." Fix: improve the demo mode and explicitly tell them how to activate it in the review notes.
- "Your app's metadata mentions medical claims." Fix: remove any language about diagnosis, treatment, or medical conditions.
- "Missing privacy policy." Fix: add a real URL.
- "App Transport Security exception not justified." Fix: either use HTTPS from the device or explain clearly why HTTP is necessary.
- "App crashes on launch." Fix: test on the actual iOS version Apple is testing on, usually the latest.

You fix the issue, submit a new build, and get reviewed again. Usually faster the second time.

**Metadata Rejected:** text or screenshot issue only. Fix and resubmit metadata without a new build.

## After Launch

- Monitor crashes in App Store Connect > Analytics
- Respond to user reviews within a few days, it helps your rating
- For most future updates, you won't need to resubmit to Apple (web app content changes deploy through Vercel). Only rebuild when you change native iOS behavior.

## Things That Will Save You Time

- Write the description, keywords, and privacy policy before you're ready to submit. Nothing worse than being ready to ship and stuck on paperwork.
- Take screenshots from the simulator for consistent sizing. Don't use photos of a phone.
- Create a separate email address (`support@yourapp.com` or similar) just for Apple correspondence and user support. Keeps your inbox clean.
- Keep a text file with all the metadata fields. When you submit updates, you can paste from it rather than retyping.

## When To Get Help

If rejected for the same reason twice, or if Apple says anything about "medical device" or "regulated health", stop and talk to an attorney who specializes in app law before proceeding. The difference between a fitness tracker and a medical device is legal, not technical, and getting it wrong can cost you the app.
