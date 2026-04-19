# Master League — Product Requirements Document

## Original Problem Statement
User (Azerbaijani, native speaker) wanted to build a brand-new football management web game inspired by eFootball's Master League mode, but better than the original. User gave full creative freedom for features + design, and additionally requested that "Sürətli" (Fast) and "Keç" (Skip) match controls be monetized at **$1 per payment** (proceeds go to the app owner via Stripe).

Original message: "Bunu yox gəl başqa saytımı başdan elə eFootballda ana lig var e Master League ondan edək sayta amma eFootballdakindan yaxşı olsun ... Əlavə funksiyaları əlavə elə birdə oyunları keç ilə sürətli olan yer 1$ olsun mənə gəlsin o pul kimsə almaq istəsə 1$ ödəsin"

## Tech Stack
- **Frontend**: React 19 (CRA + craco), react-router-dom v7, Tailwind, lucide-react, axios
- **Backend**: FastAPI (Python) + motor (MongoDB async)
- **Payments**: Stripe Checkout via `emergentintegrations` library (test key)
- **Persistence**: localStorage (primary) + MongoDB save/load by manager_name (secondary)
- **Fonts**: Bebas Neue (heading) + Exo 2 (body) + JetBrains Mono

## User Personas
1. **Azerbaijani football fan** — plays for pleasure, manages a favorite team (e.g., Qarabağ)
2. **Casual strategy gamer** — enjoys team management, transfers, long-term progression
3. **Premium player** — willing to pay $1 for speed-up/skip features

## Core Features Implemented (Session 1 — Jan 2026)
- **Setup / onboarding**: manager name + 20-team selection (4 AZ + 16 European clubs)
- **Manager HQ dashboard**: next-match card, league position + form, finance snapshot, top scorers, inbox
- **Squad & Tactics**: 2D pitch, 3 formations (4-3-3, 4-4-2, 3-5-2), starter toggle, full 18-player roster
- **Live match**: text commentary, real-time minute ticker, normal/fast/skip playback, scoreboard + stats
- **League**: 38-round round-robin, W/D/L table with Pts / GD / form, zone highlighting (champion / Europe / relegation)
- **Fixtures**: full season calendar with past results
- **Transfer market**: buy/sell, search, position filter, budget validation
- **Training**: per-player training at €500K (+1 OVR, 60% chance)
- **Finance**: budget, squad value, wages, top earners
- **Cup** (Azərbaycan Kuboku): 16-team knockout, 1/8 → Final, €5M reward
- **European League** (Avropa Liqası): 16-team knockout, €20M reward
- **AI rival transfers**: every 5 weeks rivals swap players (inbox notifications)
- **Season progression**: young players grow, older decline, automatic new season
- **Cloud save**: POST /api/save, GET /api/load/{name}
- **Leaderboard**: GET /api/leaderboard (top managers by trophies)
- **Monetization**: $1 Stripe Checkout paywall for Fast/Skip modes (one-time per session)

## API Endpoints (backend)
- `GET /api/` — health
- `POST /api/save` — persist game state
- `GET /api/load/{manager_name}` — load saved game
- `GET /api/leaderboard` — top managers
- `DELETE /api/save/{manager_name}` — clear save
- `POST /api/payments/checkout` — start Stripe Checkout for match_skip package
- `GET /api/payments/status/{session_id}` — poll payment status
- `POST /api/webhook/stripe` — Stripe webhook handler

## Prioritized Backlog (Future)
- **P1**: More stats panel (pace/shot/pass/def visible in transfer list), player contracts with expiry
- **P1**: Mobile-optimised squad drag/drop instead of prompt-based swap
- **P1**: Detailed match engine (substitutions, tactical changes mid-match)
- **P2**: Real club logos via SVG/PNG (currently emoji logos)
- **P2**: Goalkeeper glove / kit designs on pitch dots
- **P2**: Social share of league title (shareability boost)
- **P2**: Youth academy / scout reports
- **P3**: Multiplayer mode (H2H)

## Implementation Status (as of 2026-01-19)
- ✅ All P0 features working (verified via screenshots)
- ✅ Stripe checkout returns valid session URL
- ✅ Cup bracket visually renders 1/8 → final with live results
- ✅ European league parallel to cup
- ✅ No lint errors

## Next Tasks
1. Optional: Verify Stripe payment flow end-to-end with test card 4242 4242 4242 4242
2. Consider adding trophy showcase page
3. Add scout rating badges to transfer market rows
