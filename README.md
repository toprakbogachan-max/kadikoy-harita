# Kadıköy Harita

A city-discovery web app. A map is the home screen; on it sit the places people
have pinned and the experience notes they left on those places.

**Live:** https://kadikoy-harita.vercel.app · **Türkçe:** [README.tr.md](README.tr.md)

<p align="center">
  <img src="docs/01-harita.png"    alt="Map screen — pins around Bahariye" width="300">
  <img src="docs/02-pin-formu.png" alt="Pin form — required fields" width="300">
</p>
<p align="center"><sub>Map · pin form</sub></p>

> The interface, the copy and the code identifiers are all in Turkish — this is a
> product built for one neighbourhood in Istanbul, and the language is part of that.

---

## Why

The idea came out of a trip to Barcelona. Finding somewhere to eat as a tourist meant
combing through TikTok and Instagram one post at a time, and the information that
actually mattered was still missing — whether you needed a reservation, whether the
place was even open that day.

Google Maps answers "what is here". This app answers **"what do I need to know before
I go"** and **"is this place for me"**. Every product decision follows from that split.

---

## The rating system

There is no single star score. On Google Maps everything lands at 4.3 and nothing is
distinguishable, because a star measures "how good is it". The fields here measure
"is it right for **me**".

**Required when you drop a pin:** photo · three words · the occasion you came for · personal-fit score (1–10) · a concrete note (≥15 characters)

**Optional:** what you'd change · how often you'd come · would you return · spend per person · service · atmosphere · value

The required fields are a quality gate. Once a photo and a specific note are demanded,
the lazy "it was lovely" pin drops out on its own. The form does the filtering, not a
moderation queue — the second screenshot above is that form.

A place page **does not show an average, it shows a distribution:**

- Three-word tags → a frequency-weighted word cloud; this is the place's identity
- Scores → a 1–10 distribution bar, plus **a separate average from the people you follow**
  (if five people whose taste you trust gave it an 8, the crowd's 6.5 is not your concern)
- "What you'd change" notes → listed one under another; in practice, the venue's to-do list

---

## Three surfaces

| Surface | Job |
|---|---|
| **Map** | What is where. The landing screen; this is the discovery surface. |
| **Feed** | Who posted what. Three tabs — Discover (likes ÷ freshness), Popular (raw likes, weekly), Following (chronological). The three orderings are deliberately different. |
| **Profile** | A person's own map. The `/@username` link is meant to be shared outside the app. |

---

## Stack

**Next.js 16** (App Router) · **React 19** · **TypeScript** · **Tailwind CSS 4**
**Supabase** — Postgres + PostGIS, Row Level Security, Storage, Auth
**MapLibre GL** — map tiles via OpenFreeMap

Roughly 9,300 lines across 53 files, with 17 database migrations.

### Decisions worth calling out

- **Security lives in the database, not in a key.** The `anon` key ships in the client
  bundle by design; who may read and write what is defined entirely by the RLS policies
  in `schema.sql`. The `service_role` key is never used anywhere.
- **Geo queries run in PostGIS.** Place search, proximity and the "is this inside
  Kadıköy" check all run in the database rather than on the client.
- **The MapLibre worker is served by hand.** MapLibre builds its worker from a string
  URL at runtime, so Turbopack never bundles it and the map comes up blank; the worker
  is served from `public/maplibre/` instead (`scripts/maplibre-worker-kopyala.mjs`,
  wired into `predev`/`prebuild`).
- **Demo accounts are read-only.** The repo is public, so the demo password is public
  too — and those accounts cannot write anything at the database level
  (`public.demo_hesap()`, `scripts/goc/15-demo-salt-okunur.sql`). The restriction is in
  RLS rather than in the UI, so going straight at the API does not get around it.
- **Next.js 16 migration.** `middleware.ts` was renamed to `proxy.ts`, and Supabase
  session refresh was rewritten to match.

---

## Layout

```
.
├── schema.sql                 # database schema + RLS policies
├── BRIEF.md                   # product decisions and the reasoning behind them (TR)
├── kadikoy-harita-mimari.md   # architecture notes (TR)
├── prototip.html              # design reference — a working UI prototype
├── docs/                      # README screenshots
└── web/
    ├── app/                   # App Router pages and route handlers
    ├── components/            # UI components
    ├── lib/                   # data access, ranking, geography, session
    └── scripts/
        ├── goc/               # database migrations (run in order)
        └── tohum/             # demo data generation
```

---

## Running it

```bash
git clone https://github.com/toprakbogachan-max/kadikoy-harita.git
cd kadikoy-harita/web
npm install
cp .env.local.example .env.local   # fill in the Supabase URL + anon key
npm run dev
```

For the database: create a Supabase project, run `schema.sql` in the SQL Editor, then
apply the migrations under `web/scripts/goc/` in numerical order.

`.env.local` is never committed.

---

## Design

The metaphor is a **cork board**: the map is the board, places are push pins, reviews
are pinned notes. Light, paper-toned theme — ground `#F6F1E4`, board `#E9DFC9`, ink
`#23343C`, brass accent `#B8801A`. Oswald for signage, Karla for body text,
JetBrains Mono for figures.

---

## Status

Under active development. One city, one district — Istanbul / Kadıköy. The target is
roughly 200 places, seeded by hand, because an empty map kills the product before
anyone gets to use it.

---

## License

MIT — see [`LICENSE`](LICENSE).
