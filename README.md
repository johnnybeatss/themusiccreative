# The Music Creative @ FIU — Website

Phase 1 foundation scaffold. See `musiccreative_website-plan_v1.md` for the
full architecture plan and roadmap. Stack: Next.js 16 (App Router,
TypeScript, Turbopack) + Tailwind CSS v4 + Supabase (Postgres, Auth,
Storage), deployed on Vercel.

## Status

- **Phase 1 (this scaffold):** done — public + E-Board route structure,
  Supabase client plumbing, auth gate (`src/proxy.ts` + `eboard/layout.tsx`).
- **Phase 2 (data layer):** not started — no live Supabase project yet.
  Public pages render an empty/placeholder state until it's connected.
- **Phase 3 (public content):** Home/About uses the real mission statement.
  Events/Opportunities/Team are wired to fetch from Supabase but show
  fallback copy with no project configured. Team roster is incomplete
  pending names/bios from Johnny.
- **Phase 4 (E-Board auth + forms):** stubbed — `/eboard/login` has no
  actual form yet, and there are no write/edit forms in the E-Board pages
  yet (read-only for now).
- **Phases 5-8:** not started (design pass, content migration from Notion,
  repointing the weekly automation, QA/launch).

## A note on how this was built

This scaffold was hand-authored rather than generated with
`create-next-app`, because the cloud sandbox it was built in doesn't have
package-registry access (npm/pypi blocked at the network layer). No
`npm install` has been run and there's no `package-lock.json` — one will
be generated the first time you run `npm install` somewhere with real
network access (your machine, CI, or Vercel's build servers all work
fine).

Versions in `package.json` (Next.js ^16.3, Tailwind ^4.3, React ^19) were
verified via live web search against current docs/release notes at the
time this was written (Aug 2026), not assumed from training data — but
double-check `npm outdated` after your first install, since patch
versions move fast.

One more flag: Supabase's own docs currently show a newer key-naming
convention (`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`) alongside the classic
`NEXT_PUBLIC_SUPABASE_ANON_KEY` used here. Both should work — the classic
name is what's used throughout this codebase for now since it's the
longer-established, unambiguously-supported one. Confirm which your
Supabase project's dashboard hands you at Phase 2 and adjust `.env.local`
accordingly (the variable *names* in code stay the same either way; you're
just deciding which literal key Supabase gives you to paste in).

## Getting started (once you can run npm)

```bash
npm install
cp .env.example .env.local   # fill in once Supabase project exists (Phase 2)
npm run dev
```

Public pages work with no `.env.local` at all (Events/Opportunities/Team
just show placeholder copy). The E-Board area shows a "not wired up yet"
message until `NEXT_PUBLIC_SUPABASE_URL` is set.

## Project structure

```
src/app/                 # public pages: /, /events, /opportunities, /calendar, /team
src/app/eboard/          # gated area: dashboard, reports, calendar, resources, notes
src/lib/supabase/        # browser + server Supabase client factories
src/proxy.ts             # Next.js 16's replacement for middleware.ts — gates /eboard/*
supabase/migrations/     # SQL schema + RLS policies, run once a Supabase project exists
```
