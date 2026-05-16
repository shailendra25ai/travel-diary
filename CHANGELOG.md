# Mosaic — Changelog

All notable changes to Mosaic are documented here. This project follows [Semantic Versioning](https://semver.org/) (MAJOR.MINOR.PATCH).

- **MAJOR** — Breaking changes or major rewrites
- **MINOR** — New features (backwards compatible)
- **PATCH** — Bug fixes and small polish

---

## [1.0.0] — 2026-05-16 — Pilot Release 🚀

The first version of Mosaic, ready for friends and family pilot testing.

### Features
- **Authentication** — Google Sign-In, branded popup as "Mosaic"
- **Premium home page** — Hero with rotating curated travel photos and Ken Burns animation, time-of-day greeting, "On this day" memory unlocks, daily travel quote, stats overview, quick actions
- **Trips page** — List and Map views, photo pins on world map color-coded by trip status (current/upcoming/past), stats bar, delete trip
- **Create Trip wizard** — 5-step mobile-first flow: name → destination (Google Maps autocomplete) → dates → cover photo → review
- **Edit Trip** — Trip creator can edit title, location, dates, cover; or delete trip
- **Trip detail page** — Cover with smart blurred background, location, dates, member avatars, small map widget, day-by-day timeline
- **Diary entries** — Photos + text + location per day per member; each member can edit/delete only their own entries
- **Multi-perspective view** — Toggle "My Timeline" (your view + perspective avatars) vs "Everyone" (combined feed)
- **AI Recap (Claude Sonnet)** — Two modes (single perspective / multi-perspective); five template styles: Magazine, Storybook, Polaroid Scrapbook, Split POV, Stories
- **Casual brand-voice system prompt** — Recaps written like a friend retelling the trip, not flowery prose
- **Share recap** — Public web page at `/share/{code}`, multi-page PDF export that mirrors the web layout, native share sheet on mobile (clipboard fallback on desktop)
- **Invite flow** — Random invite codes, native share sheet, anyone with link can join after signing in
- **Branding** — Logo system (icon, wide, stacked), warm color palette, Georgia serif headings, Open Graph tags for social previews
- **PWA support** — manifest, Apple touch icons; users can add Mosaic to their home screen
- **Smart photo handling** — Blurred background + contained image so portrait photos never get cropped
- **Onboarding** — First-time welcome modal (3 cards explaining the core concept)
- **Self-serve UX** — Empty states with clear next steps, italic sage-green inline hints under section labels
- **Feedback widget** — Floating button → side panel form (rating, likes, dislikes, bugs), submissions land in admin inbox
- **Admin inbox** — `/admin/feedback` page (owner-only), real-time list of all feedback with stats
- **Bottom navigation** — Home · Trips · Admin (admin tab visible to owner only)
- **Marketing landing page** — Full pre-login experience with hero, how-it-works, differentiator, audience, CTAs

### Tech stack
- React (Vite) frontend
- Firebase Authentication, Firestore, Storage
- Vercel hosting with serverless function for Claude API
- Anthropic Claude Sonnet for recap generation
- Google Maps Platform for locations
- jsPDF + html2canvas for PDF export

### Known limitations (parked for Phase 2)
- Recap generation uses text only — Claude doesn't see the photos
- Invite model is "anyone with link" — no email invites or approval queue
- No Google Photos import (users upload from device)
- Mobile-first; desktop works but isn't optimized
- No real-time collaboration on shared entries

---

## How to add a new release

When making changes after v1.0.0:

1. Make and test your changes
2. Add a new section to the top of this file following the same format
3. Increment the version number:
   - **Bug fix or small polish** → bump PATCH (1.0.0 → 1.0.1)
   - **New feature** → bump MINOR (1.0.0 → 1.1.0)
   - **Breaking change or rewrite** → bump MAJOR (1.0.0 → 2.0.0)
4. Tag the commit: `git tag v1.0.1 -m "Brief description"`
5. Push the tag: `git push origin v1.0.1`
6. Create a GitHub Release from the tag (optional but nice)
