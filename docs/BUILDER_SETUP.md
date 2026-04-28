# Builder.io Setup Guide

Server driven UI lets you change the app's layout without redeploying. It's optional, the app works fine without it. Set this up when you want drag and drop layout editing.

## Why Use It

- Move components around on the screen without touching code
- Non developers on your team can edit the layout
- A/B test different layouts
- Roll out new arrangements instantly to all users

## Why You Might Not

- Adds another service dependency
- Requires learning the Builder.io editor
- For a simple three component app, editing code is often just as fast

## Setup Steps

### 1. Create Account

Go to builder.io, sign up. Create a new Space for this project.

### 2. Get The API Key

Account Settings > API Keys. Copy the public API key. Add to `.env`:

```
VITE_BUILDER_API_KEY=your_key_here
```

### 3. Create Your First Layout

In the Builder.io dashboard, go to Content > New > Page. Name it something like "main-layout". When the editor opens:

- Drag the four custom components from the right sidebar:
  - FrequencyRing
  - BarChart
  - RecordControls
  - StatusBar
- Arrange them how you want
- Save and Publish

### 4. Link The Layout To The App

In Builder.io, click on the page you just created. Find the Entry ID (or Content ID) in the URL or the right sidebar. Copy it.

Open the admin panel, log in, find the `builder_content_id` config row. Paste the ID and save.

### 5. Enable Builder Rendering

In `web-app/src/App.jsx`, change:

```js
const USE_BUILDER_LAYOUT = false
```

to:

```js
const USE_BUILDER_LAYOUT = true
```

Redeploy.

## How Data Flows

The components registered with Builder.io accept the same props as in code. When you edit the layout, Builder.io produces JSON that describes which components go where and with what static inputs. At runtime, the app fetches this JSON and renders it.

But live data (current frequency, readings list) still comes from hooks in the app code. To connect the rendered components to live data, you pass values through Builder.io's data bindings or you wrap the layout with a data provider.

This project uses a simple approach: the top level `LayoutRenderer` renders the Builder.io content, and inside the content, the components use context to access live data. If you need more advanced data flow, read the Builder.io docs on data bindings and targeting.

## Publishing Workflow

1. Make changes in Builder.io editor
2. Click "Publish"
3. Changes appear in the app within about 30 seconds
4. No app rebuild needed

## Reverting A Layout

In Builder.io, every save is versioned. Go to the page's History tab and restore any previous version. Takes 30 seconds.

## Gotchas

- Components MUST be registered before the app fetches content, or the layout renders with gaps. This is already handled in `main.jsx`.
- Changes in Builder.io take a few seconds to propagate through their CDN. If you don't see a change immediately, wait 30 seconds.
- Complex conditional logic (if/else rendering based on data) is hard to express in Builder.io. Keep that logic in code and use Builder.io only for layout.
- The free tier has usage limits. Check the current pricing before relying on it for a production app.
