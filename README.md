# Loopify MusicPlayer

A full-featured, cross-platform music streaming app built with **React Native + Expo**. It streams music on-demand through the unofficial JioSaavn API, with a dark-purple UI, persistent library, queue management, lyrics, and background audio.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Setup & Installation](#setup--installation)
- [Running the App](#running-the-app)
- [Building for Production](#building-for-production)
- [API Layer](#api-layer)
- [State Management](#state-management)
- [Audio Engine](#audio-engine)
- [Navigation](#navigation)
- [Trade-offs & Design Decisions](#trade-offs--design-decisions)
- [Known Limitations](#known-limitations)

---

## Features

| Category | Details |
|---|---|
| **Streaming** | On-demand music via JioSaavn (up to 320 kbps) |
| **Search** | Real-time song & album search with infinite scroll and 500 ms debounce |
| **Browse** | Genre categories (Hip-Hop, Pop, Rock, Bollywood, Lo-Fi, etc.) + Mood shortcuts (Chill, Workout, Focus, Party, Romance, Sleep) |
| **Home Feed** | Featured songs, New Releases, and curated album cards |
| **Full-Screen Player** | Album art, seek slider, play/pause/prev/next, shuffle, repeat (off / one / all) |
| **Mini Player** | Persistent playback bar above the tab bar with a live progress strip |
| **Queue** | Add, reorder (drag-and-drop), remove songs; play from any position |
| **Lyrics** | Fetched on demand and displayed inline in the player screen |
| **Liked Songs** | Heart a song anywhere; dedicated Liked Songs screen |
| **Saved Albums** | Save albums to Library; browse and navigate to full album listings |
| **Playlists** | Create, rename, delete playlists; add / remove songs |
| **Background Audio** | Continues playing when the app is backgrounded (iOS + Android) |
| **Persistence** | Library (liked songs, playlists, saved albums, queue) survives app restarts via AsyncStorage |

---

## Tech Stack

| Layer | Library / Version |
|---|---|
| Framework | React Native `0.83.2` + Expo `~55` |
| Language | TypeScript `~5.9` |
| Navigation | React Navigation v7 (Stack + Bottom Tabs) |
| State | Zustand `^5` with `persist` middleware |
| Audio | `expo-av` `^16` |
| Storage | `@react-native-async-storage/async-storage` |
| Animations | `react-native-reanimated` `^4` + `react-native-worklets` |
| Drag & Drop | `react-native-draggable-flatlist` `^4` |
| Gestures | `react-native-gesture-handler` `^2` |
| Icons | `@expo/vector-icons` (Ionicons + MaterialCommunityIcons + Feather) |
| Gradient | `expo-linear-gradient` |
| Slider | `@react-native-community/slider` `^5` |
| Build | EAS Build (Expo Application Services) |

---

## Architecture

```
<img width="2076" height="949" alt="image" src="https://github.com/user-attachments/assets/079b9648-36b0-453e-9ca3-8792f0cc1706" />


<img width="1691" height="840" alt="image" src="https://github.com/user-attachments/assets/1293ac0e-2bd9-4f49-b4e3-ad3971f51e7d" />

```

### Key Architectural Principles

1. **Single source of truth** — Zustand store owns all player state (current song, queue, position, duration, seek requests). The `useAudioPlayer` hook is a *side-effect subscriber*, not a controller.

2. **Singleton audio hook** — `useAudioPlayer` is mounted once at the App root so the `Audio.Sound` object is never recreated by navigation events. Screens interact exclusively through the store.

3. **Normalised API types** — Both `Song` (from `/api/songs`) and `SearchResult` (from `/api/search/songs`) are normalised into the same `Song` shape via `normalizeSearchResult()` before entering the store, so all downstream code is type-consistent.

4. **Lazy audio URL resolution** — If a song object lacks a valid download URL (common for search results that omit it), `loadAndPlay` fetches the full song by ID at playback time rather than preemptively.

5. **Persistence boundary** — Only user-library data (liked songs, playlists, saved albums, queue) is persisted. Transient UI state (search results, loading flags) is kept in local component state.

---

## Project Structure

```
MusicPlayer/
├── App.tsx                     # Root component; mounts audio hook & stack navigator
├── index.ts                    # Expo entry point
├── app.json                    # Expo config (permissions, plugins, EAS project ID)
├── eas.json                    # EAS build profiles
├── package.json
├── tsconfig.json
├── assets/                     # Static images & icons
└── src/
    ├── api/
    │   └── saavn.ts            # API client, types, normalizers, helpers
    ├── components/
    │   ├── CustomDialog.tsx    # Reusable alert/confirm dialog
    │   ├── MiniPlayer.tsx      # Persistent bottom playback bar
    │   ├── PlaylistPickerModal.tsx  # Sheet modal for adding a song to a playlist
    │   ├── QueueModal.tsx      # Drag-reorderable queue sheet
    │   └── SongItem.tsx        # Reusable song row with context menu
    ├── hooks/
    │   └── useAudioPlayer.ts   # expo-av lifecycle, play/pause/seek/queue logic
    ├── navigation/
    │   ├── AppNavigator.tsx    # (legacy) simple stack — superseded by App.tsx
    │   └── TabNavigator.tsx    # Bottom tab bar + MiniPlayer injection
    ├── screens/
    │   ├── HomeScreen.tsx      # Discover feed, moods, featured songs & albums
    │   ├── SearchScreen.tsx    # Search bar, genre tiles, infinite-scroll results
    │   ├── LibraryScreen.tsx   # Queue / Saved Albums / Playlists tabs
    │   ├── LikedSongsScreen.tsx
    │   ├── PlayerScreen.tsx    # Full-screen player, lyrics, queue panel
    │   ├── AlbumScreen.tsx     # Album detail with song list
    │   └── PlaylistScreen.tsx  # Playlist detail with song list
    └── store/
        └── useStore.ts         # Zustand store — all global state + actions
```

---

## Setup & Installation

### Prerequisites

| Tool | Minimum Version |
|---|---|
| Node.js | 18 LTS or newer |
| npm | 9+ (or yarn / pnpm) |
| Expo CLI | latest (`npm i -g expo-cli`) |
| EAS CLI | latest (`npm i -g eas-cli`) — only needed for production builds |
| Android Studio | For Android emulator / device builds |
| Xcode | For iOS simulator / device builds (macOS only) |
| Expo Go app | For quick device preview (limited — see trade-offs) |

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd MusicPlayer
```

### 2. Install dependencies

```bash
npm install
```

### 3. (Optional) Configure the Android package name

Open [app.json](app.json) and update `expo.android.package` from `com.yourname.musicplayer` to your own reverse-domain identifier before making a build.

### 4. Prebuild native projects (required for `expo-av` background audio)

```bash
npx expo prebuild
```

This generates the `android/` and `ios/` directories with the correct native configuration. You only need to run this once (or after changing native plugins/permissions).

---

## Running the App

### Development server

```bash
npm start
# or
npx expo start
```

Then press:
- `a` — open Android emulator
- `i` — open iOS simulator (macOS only)
- Scan the QR code with Expo Go on a physical device

> **Note:** Background audio and foreground service require a **dev client** build (see below), not plain Expo Go.

### Development client (recommended for full audio features)

```bash
# Build dev client once
eas build --profile development --platform android
# or for iOS
eas build --profile development --platform ios

# Then start the dev server pointed at the dev client
npx expo start --dev-client
```

### Run directly on a connected device / emulator

```bash
npm run android   # npx expo run:android
npm run ios       # npx expo run:ios
```

---

## Building for Production

Builds are managed by **EAS Build**. Profiles are defined in [eas.json](eas.json).

```bash
# Android (APK / AAB)
eas build --platform android --profile production

# iOS (IPA)
eas build --platform ios --profile production
```

Built artifacts are available in your [Expo dashboard](https://expo.dev).

---

## API Layer

**File:** [src/api/saavn.ts](src/api/saavn.ts)

All network calls target an unofficial JioSaavn REST proxy at `https://saavn.sumit.co`.

| Function | Endpoint | Purpose |
|---|---|---|
| `searchSongs(query, page, limit)` | `GET /api/search/songs` | Song search with pagination |
| `searchAlbums(query, page, limit)` | `GET /api/search/albums` | Album search with pagination |
| `getSongById(id)` | `GET /api/songs/:id` | Full song details (including download URLs) |
| `getSongSuggestions(id)` | `GET /api/songs/:id/suggestions` | Related song recommendations |
| `getAlbumById(id)` | `GET /api/albums?id=` | Album detail with full track listing |
| `getLyrics(id)` | `GET /api/songs/:id/lyrics` | Song lyrics (HTML-stripped) |

### Helpers

- **`getBestAudioUrl(urls)`** — picks the highest available quality from `['320kbps', '160kbps', '96kbps', '48kbps']`.
- **`getBestImageUrl(images)`** — picks the highest available resolution from `['500x500', '150x150', '50x50']`.
- **`normalizeSearchResult(r)`** — maps the search-result shape to the canonical `Song` type.
- **`normalizeAlbum(raw)`** — maps raw album responses to the `Album` type.
- **`formatMs(ms)`** — formats milliseconds to `m:ss` display string.

---

## State Management

**File:** [src/store/useStore.ts](src/store/useStore.ts)

Global state lives in a single **Zustand** store, split into logical slices:

| Slice | Key fields |
|---|---|
| **Player** | `currentSong`, `isPlaying`, `position`, `duration`, `isLoading`, `seekRequest` |
| **Queue** | `queue[]`, `queueIndex`, `shuffleEnabled`, `repeatMode` |
| **Search** | `searchQuery`, `searchResults[]`, `searchPage`, `isSearching`, `hasMore` |
| **Library** | `likedSongs[]`, `savedAlbums[]`, `playlists[]` |
| **UI** | `isQueueVisible`, `pendingMoodQuery` |

The store uses the `persist` middleware backed by **AsyncStorage** to survive app restarts. Only user-library data is serialised to disk; transient playback state (position, duration, seekRequest) is excluded.

### Key actions

```
setCurrentSong  → triggers audio load in useAudioPlayer
requestSeek     → communicates seek position to the audio hook
playNext/Prev   → advances queueIndex (respects shuffle & repeat)
toggleShuffle   → randomises future queue advancement
cycleRepeat     → rotates off → one → all
```

---

## Audio Engine

**File:** [src/hooks/useAudioPlayer.ts](src/hooks/useAudioPlayer.ts)

`useAudioPlayer` is a React hook that owns the `expo-av` `Audio.Sound` instance and reacts to store changes via `useEffect` subscriptions.

```
currentSong changes  →  unload previous sound  →  fetch URL if missing
                         →  Sound.createAsync({ shouldPlay: true })
                         →  register onPlaybackStatusUpdate callback

isPlaying changes    →  sound.playAsync() / sound.pauseAsync()

repeatMode changes   →  sound.setIsLoopingAsync()

seekRequest set      →  sound.setPositionAsync(ms)  →  clearSeekRequest()

onPlaybackStatusUpdate  →  sync position/duration to store
                          →  on didJustFinish: playNext() (unless repeat=one)
```

**Audio session config (on mount):**
- `staysActiveInBackground: true` — keeps audio alive when app is backgrounded
- `playsInSilentModeIOS: true` — plays through iOS silent switch
- `shouldDuckAndroid: true` — lowers volume for notification sounds
- `playThroughEarpieceAndroid: false` — routes audio through the speaker

---

## Navigation

The navigation tree is a **Stack** at the root with a **Tab navigator** as the first screen:

```
Root Stack
 ├── Tabs (TabNavigator)
 │    ├── Home
 │    ├── Search
 │    └── Library
 ├── Player       (modal presentation, swipe-to-dismiss enabled)
 ├── Album        (receives albumId param)
 ├── Playlist     (receives playlistId param)
 └── LikedSongs
```

The `MiniPlayer` component is injected into the custom `tabBar` renderer of `TabNavigator` so it appears above the tab bar on all three tab screens without duplicating it.

---

## Trade-offs & Design Decisions

### 1. Unofficial API dependency
**Decision:** Use the public JioSaavn proxy (`saavn.sumit.co`) rather than an official API.  
**Pro:** Zero cost, zero authentication setup, rich catalogue.  
**Con:** No SLA; the endpoint can go down or change schema without notice. If the proxy breaks, all streaming stops. A fallback/caching strategy or a self-hosted instance of the [JioSaavn API server](https://github.com/sumitkolhe/jiosaavn-api) would mitigate this.

### 2. Single global `Audio.Sound` instance
**Decision:** One sound object, managed in a singleton hook mounted at the app root.  
**Pro:** No audio glitches from multiple simultaneous instances; navigation events don't interrupt playback.  
**Con:** Cannot pre-buffer the next track. Every song change involves an unload + createAsync cycle, adding ~0.5–1 s of latency.

### 3. Zustand over Redux / Context
**Decision:** Zustand with one flat store.  
**Pro:** Minimal boilerplate, built-in `persist` middleware, fine-grained subscriptions without `useSelector` overhead.  
**Con:** As the app grows, a single store file becomes large. Splitting into slices would be the natural next step.

### 4. Lazy URL resolution
**Decision:** Resolve the audio CDN URL at play time if absent, rather than eagerly on search.  
**Pro:** Search results load immediately without waiting for per-song detail fetches.  
**Con:** The first play of a search result has an extra network round trip before audio starts.

### 5. No local media / downloads
**Decision:** Stream-only; no offline download feature.  
**Pro:** Much simpler implementation (no file I/O, no DRM handling, no storage permission).  
**Con:** Requires a data connection at all times; no offline listening.

### 6. Expo managed workflow → prebuild required
**Decision:** Start with Expo but use `expo-av` which requires native code.  
**Pro:** Expo tooling, OTA updates, EAS builds.  
**Con:** Plain Expo Go is insufficient for background audio. Users must use a **dev client** or a full native build, increasing onboarding friction for contributors.

### 7. Position polling at 1-second intervals
**Decision:** `progressUpdateIntervalMillis: 1000` in `Sound.createAsync`.  
**Pro:** Avoids excessive JS bridge traffic; sufficient for a seek bar.  
**Con:** The displayed position can lag up to 1 second behind actual playback; noticeably choppy for sub-second scrubbing.

### 8. AsyncStorage for persistence
**Decision:** Persist the entire library slice to AsyncStorage via Zustand `persist`.  
**Pro:** Zero configuration; works identically on Android and iOS.  
**Con:** AsyncStorage is synchronous to the JS thread and is not suited for large datasets. With hundreds of liked songs and long playlists, hydration on startup will block the JS thread briefly.

---

## Known Limitations

- **No lock-screen controls / media notification** — `expo-av` alone does not register a system media session. Users can play/pause only from within the app. Adding `react-native-track-player` would resolve this.
- **No gapless playback** — There is always a brief gap between tracks.
- **iOS background audio** requires building with `UIBackgroundModes: ["audio"]` (already configured in [app.json](app.json)) and a dev client or production build.
- **Android foreground service** for media playback requires `FOREGROUND_SERVICE_MEDIA_PLAYBACK` permission (already declared in [app.json](app.json)).
- **Web support is incomplete** — `expo-av` and some dependencies have limited web compatibility. The `npm run web` script exists but is not actively maintained.
