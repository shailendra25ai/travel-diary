# Mosaic — Product Spec

*Many pieces. One unforgettable trip.*

---

## 1. Project Vision

Mosaic is a beautiful, multi-perspective travel memory app that turns group trips into stories worth keeping. Where traditional photo-sharing apps reduce trips to one person's highlight reel, Mosaic captures every member's point of view — and weaves them into shareable, AI-written recaps that feel like editorial-quality keepsakes.

### Target audience
Adults 35+ traveling in close-knit groups — families, couples-with-couples, old friends. They take meaningful trips together and want a beautiful shared place to capture and relive them. Not Gen Z social posters. Not solo digital nomads. People who value memory over engagement.

### Core differentiator
**Multi-perspective trip recaps** — the same trip, told through every member's eyes, then turned into shareable AI-generated content. No other travel app does this.

### Pain point being solved
When friends and family travel together, photos get lost in chaotic WhatsApp groups. There's no single beautiful place where everyone's memories live and can be relived together later.

### Design principles
- **Simplicity over features** — must work for someone who isn't tech-savvy
- **Beautiful, not trendy** — timeless aesthetics, premium feel
- **Privacy-first** — no public profiles, no algorithms, no public discovery
- **The recap is the hero** — it's the moment of joy that drives sharing
- **WhatsApp-first sharing** with seamless Instagram support

---

## 2. Project Charter

### Goal
Validate that close-knit groups (35+) love capturing trips together and sharing the AI-generated recaps. Validation comes from pilot users actually using the app on real trips and asking to use it again.

### Success criteria for pilot
- **Adoption**: At least 5 trips created with 2+ members per trip
- **Engagement**: Each trip averages at least 3 diary entries per active member
- **Output**: At least 5 recaps generated and shared via WhatsApp or public link
- **Qualitative**: 8/10 pilot users say they would use Mosaic again on their next trip

### In scope (Pilot — MVP v1)
- Mobile-friendly web app (no native apps yet)
- Group trip creation and invite via link
- Daily diary entries with photos + text + location
- Multi-perspective view of each day
- AI-generated trip recap (Claude) with 5 visual template styles
- PDF and public web link sharing
- Premium home page with emotional, brand-forward design

### Out of scope (Pilot)
- Native iOS / Android apps
- AI video reels (deferred to Phase 2)
- Public social feed, comments, likes (intentionally cut)
- Filters, effects, gamification, streaks (intentionally cut)
- Offline mode (deferred)
- Public marketing landing page (deferred until ready to share publicly)

### Stakeholders
- **Owner / Product**: Shailendra
- **Build partner**: Claude (Anthropic)
- **Pilot users**: Friends, family, and close circle

### Timeline
- **MVP v1 build**: Complete
- **Pilot launch**: When ready (Shailendra-controlled)
- **Pilot duration**: 4-8 weeks of real trips
- **Phase 2 planning**: Driven by pilot feedback, not pre-decided

---

## 3. Brand Identity

- **Name**: Mosaic
- **Tagline**: Many pieces. One unforgettable trip.
- **Logo**: A 2×2 grid of warm-toned squares (terracotta, navy, sage, sandy gold) with a serif wordmark
- **Voice**: Warm, evocative, literary. Speaks to the emotion of travel, not the logistics.
- **Color palette**:
  - Warm terracotta `#c89060`
  - Sandy gold `#b09070`
  - Deep navy `#2d4a8a`
  - Sage green `#7a8a5a`
  - Cream background `#f9f6f1`
  - Charcoal text `#1a1a1a`
- **Typography**: Georgia serif for headings, system sans-serif for body
- **Visual language**: Editorial, magazine-inspired, photo-driven

---

## 4. Tech Stack

| Layer | Technology | Why |
|---|---|---|
| Frontend | React (Vite) | Modern, fast, well-documented for a non-developer to maintain |
| Hosting | Vercel | Auto-deploy from GitHub, free tier covers pilot |
| Auth | Firebase Authentication (Google Sign-In) | One-tap login, trusted, no password fatigue |
| Database | Cloud Firestore | Real-time sync, scales free for pilot |
| Storage | Firebase Storage | Photos, generously free for pilot |
| AI Recap | Anthropic Claude (Sonnet) | Best-in-class for warm, emotional writing |
| Maps | Google Maps Platform | Best-in-class autocomplete and styling; $300 credit covers pilot |
| PDF | jsPDF + html2canvas | Screenshot-style PDF that mirrors web layout |
| Source control | GitHub | Standard, free, integrates with Vercel |

---

## 5. Pilot Features (MVP v1 — Built)

### 5.1 Authentication
- Google Sign-In only (single-tap)
- Brand display name shown in Google popup ("Mosaic")
- Sign out from any header

### 5.2 Home page (emotional brand surface)
- Hero with rotating travel photo (10 curated Unsplash backgrounds, Ken Burns zoom animation)
- Time-of-day greeting (*"Good evening, Shailendra"*)
- Status card: shows "Currently traveling" or "Upcoming trip" with countdown
- **"On this day"** — surfaces trips from the same date 1+ years ago
- Daily rotating travel quote
- Stats: trips · countries · days
- Quick actions to create a trip or view all

### 5.3 Trips page (functional dashboard)
- List view: trip cards with cover photo, title, location, dates, members
- Map view: photo pins on a world map showing all trip destinations
  - Color-coded by status (sage = current, terracotta = upcoming, navy = past)
  - Stats bar (trips, countries, days)
  - Custom photo pins with trip title labels
  - Click pin → trip details card → "Open trip"
- Toggle between List and Map views
- Delete trip (creator only)

### 5.4 Create Trip (5-step wizard, mobile-first)
1. **What's this trip called?** — text input
2. **Where are you going?** — Google Maps autocomplete with mini map preview
3. **When?** — start date, end date, or "open-ended" toggle
4. **Cover photo** — drag/drop or browse (optional)
5. **Review & create** — clean summary card

### 5.5 Trip detail page
- Cover photo with smart blurred background (handles any aspect ratio)
- Trip title, location, dates, member avatars
- Small map widget of the destination
- **Edit / Delete trip** (creator only)
- **Generate AI Recap** button (terracotta-navy gradient)
- **Invite** button → native share sheet on mobile, clipboard fallback on desktop
- Day-by-day timeline:
  - Each day shows your entry + perspective switcher to view other members' entries
  - Toggle between "My Timeline" (your view + perspective switcher) and "Everyone" (combined)
  - Add entry for any day you haven't written one
  - Edit/delete your own entries (✎ / 🗑 icons appear only on your entries)

### 5.6 Diary entries
- One entry per day per person
- Fields: text description, multiple photos, location text
- Photos upload on save (not on selection)
- Edit own entry — change text, location, add new photos, remove existing photos
- Delete own entry with confirmation

### 5.7 Multi-perspective view
- Each day's row shows your entry by default
- Avatar row to switch to another member's perspective of the same day
- "Everyone" tab shows all members' entries for each day stacked together
- The unique value prop made visual

### 5.8 AI Recap (Claude Sonnet)
**Two modes:**
- *Just me* — single perspective from your point of view
- *Everyone* — multi-perspective, weaves together all members' contributions

**Five template styles (different visual treatments):**
1. **Magazine** — editorial layout, big photos, clean typography
2. **Storybook** — alternating photo/text columns, flowing narrative
3. **Polaroid Scrapbook** — casual, rotated polaroids, handwritten-style notes
4. **Split POV** — side-by-side comparison (the hero template for multi-perspective)
5. **Stories** — vertical Instagram Story-style cards

Claude generates: a creative trip title, opening summary, per-day captions, and a closing reflection.

Currently sends text + location + names to Claude. Does NOT send photos (text-only generation).

### 5.9 Share recap (public web page)
- Branded landing at `/share/{shareCode}` — no login required to view
- Renders in the chosen template style
- Smart photos: blurred background + contained image so portrait phone photos never crop faces
- Sticky action bar with native share sheet button + "Download PDF"
- Branded with Mosaic logo, tagline, and footer
- Open Graph tags so the link preview is beautiful in WhatsApp / Twitter / etc.

### 5.10 PDF export
- Captures the rendered web page as a multi-page PDF
- Includes all photos at full quality (CORS configured on Firebase Storage)
- Same template as the web view — total visual consistency

### 5.11 Invites
- Random 8-character invite code per trip
- Anyone with the URL can join after signing in with Google (same model as Google Docs "anyone with the link")
- Native share sheet on mobile, clipboard fallback on desktop
- Pre-filled message: *"X invited you to 'Trip Name' on Mosaic — add your perspective"*

### 5.12 PWA / Mobile install
- `manifest.json` configured for "Add to Home Screen"
- Standalone display mode (looks like a native app once installed)
- Branded launch screen and icon

### 5.13 Feedback widget (pilot only)
- Floating "💬 Feedback" button on every page (logged-in users only)
- Side-panel form with: 5-star rating, likes, dislikes, bugs
- Auto-captures page URL, timestamp, user info, browser info
- Submissions land in admin inbox

### 5.14 Admin inbox
- Accessible at `/admin/feedback` — visible only to the owner's email
- Real-time list of all feedback as users submit
- Filter-able by rating, type
- Stats summary (total submissions, avg rating)
- Admin tab visible in bottom navigation only for the owner

### 5.15 Permission model
- **Trip creator**: can edit/delete the trip itself (title, location, dates, cover) and remove the trip entirely
- **Any member**: can edit/delete only their own diary entries
- Anyone with the invite link can join

---

## 6. Phase 2 Backlog (post-pilot)

Items here are NOT prioritized — final priority will come from pilot feedback.

### From the original spec
- **AI Video Reels** — vertical 15-60s reels, multi-perspective comparison reels (*"4 people, same trip"*), music-ready, auto-captioned
- **Format-Specific Exports** — Instagram Stories, Instagram Feed Carousel, TikTok vertical reel
- **Smart Capture Helpers** — daily nudges during trips, voice-to-text entries with AI structuring
- **Native iOS + Android Apps** — React Native conversion, App Store + Play Store submission

### Added during MVP build
- **Google Photos integration** — import photos directly from Google Photos library rather than uploading from local drive each time
- **Claude Vision for recap generation** — currently Claude only sees text descriptions and locations. Adding vision would let Claude describe actual photo contents (lighting, mood, who's in the shot) and produce dramatically richer captions. Estimated cost: ~$0.15-0.30 per recap (vs. current $0.01-0.02). Recommend a "smart fallback" that only sends photos when text is sparse.
- **Per-entry map pins** — current location is a text field; could become a "Map Journey" recap template that traces a trip's path
- **Trip cover photo picker** — pick the cover from photos already in the trip rather than re-uploading
- **Invite by email** — type emails to invite specific people instead of "anyone with the link"
- **Approval queue for joining** — creator approves requests instead of automatic join
- **Public marketing landing page** — for when sharing the app publicly with strangers
- **Comments / reactions on entries** — was explicitly cut from MVP per design principles, but worth revisiting based on whether pilot users feel the absence

### Future (v3+ from spec)
- Memory unlock notifications — *"1 year ago in Bali..."* — partially built (shown on home page; could become push notifications)
- Private vs. shared toggle per entry
- Collaborative live editing during trips
- Print-to-physical-book partnership
- Trip stats and travel maps
- Offline mode

---

## 7. Known Limitations / Risks

- **Invite security**: Anyone with the link can join. Acceptable for pilot but should be tightened (Option A: invite by email; Option D: manual member removal) before public launch.
- **Photo storage costs**: Firebase Blaze plan is pay-as-you-go. Free tier covers pilot but heavy use post-pilot needs monitoring.
- **Claude API cost**: ~$0.01-0.02 per recap currently. With vision (if added in v2), this rises to $0.15-0.30. Budget alerts recommended.
- **Mobile-only design**: Built mobile-first; desktop works but is not optimized for it. May feel sparse on large screens.
- **No real-time collaboration**: Two members editing the same entry simultaneously could conflict. Last write wins (acceptable risk for now).
- **PDF generation is client-side**: Long trips with many photos may slow down older phones during PDF export.

---

## 8. Sharing Strategy

| Destination | When users pick it | What we optimize for |
|---|---|---|
| Private (in-app) | Personal / intimate moments | Beautiful archive |
| WhatsApp groups | *"Look what we did, just us"* | Easy PDF + link sharing via native share sheet |
| Instagram Stories / Feed | Pride moments, milestone trips | (Deferred to v2 — format-specific exports) |
| Public web link | When recipients don't have the app | Beautiful preview + soft CTA + branded footer |

**Branding strategy on outputs:**
- Subtle, premium *"Made with Mosaic"* placement — not pushy banners
- Web preview pages double as marketing surfaces (Open Graph tags pre-configured)
- Comparison-style outputs (Split POV) as the unique differentiator that drives word-of-mouth
