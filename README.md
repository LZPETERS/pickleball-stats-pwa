# Pickleball Stats PWA

A lightweight progressive web app for logging pickleball games, tracking fault categories, and seeing recent results. The app uses Supabase for authentication and persistence and is built with React, TypeScript, Vite, Tailwind CSS, and TanStack Query.

## Features
- Email/password authentication with Supabase, including sign up and password reset flows.
- Quick game capture with date, time, location, and score entry.
- Fault tracker for serve, return, net, long, and setup/kill mistakes with an easy tap-to-edit modal.
- Recent games table limited to the signed-in user, powered by TanStack Query and Supabase row-level filters.
- Mobile-friendly, dark UI styled with Tailwind CSS.

## Tech stack
- **Framework**: React 19 + TypeScript with Vite.
- **State/data**: @tanstack/react-query for Supabase reads, React state for in-progress game edits.
- **Styling**: Tailwind CSS with gradient backgrounds and glassmorphism-inspired cards.
- **Auth & DB**: Supabase hosted Postgres with RLS.

## Prerequisites
- Node.js 18+ (Node 20 recommended)
- npm
- A Supabase project with email/password auth enabled

## Local setup
1. Install dependencies:
   ```bash
   npm install
   ```
2. Create a `.env` file in the project root with your Supabase credentials:
   ```bash
   VITE_SUPABASE_URL="https://YOUR-PROJECT.supabase.co"
   VITE_SUPABASE_ANON_KEY="YOUR_ANON_PUBLIC_KEY"
   ```
3. Start the dev server:
   ```bash
   npm run dev
   ```
   The app defaults to http://localhost:5174.

## Supabase schema
Create a `games` table that records per-user results and fault counts. One example schema:
```sql
create table public.games (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users not null,
  played_at timestamptz not null,
  my_points int not null,
  opp_points int not null,
  location text,
  serve_faults int not null default 0,
  return_faults int not null default 0,
  into_net int not null default 0,
  too_long int not null default 0,
  setup_kill int not null default 0
);

alter table public.games enable row level security;
create policy "Users can manage their games" on public.games
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
```
The app queries and inserts the columns above; adjust names here and in `src/routes/Dashboard.tsx` if you change them.

## Available scripts
- `npm run dev` – start Vite in dev mode.
- `npm run build` – type-check and build the production bundle.
- `npm run preview` – serve the built app locally.
- `npm run lint` – run ESLint over the project.

## Project structure
- `src/main.tsx` – app bootstrap with router and React Query provider.
- `src/routes/SignIn.tsx` – sign-in/sign-up UI plus password reset request.
- `src/routes/Dashboard.tsx` – game entry form, fault tracker, and recent games list.
- `src/routes/Reset.tsx` – password update flow after Supabase reset link.
- `src/lib/supabase.ts` – Supabase client wired to Vite env vars.

## Deployment tips
- Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in your hosting provider’s environment variables.
- Ensure RLS policies allow the authenticated user to read/write their rows (see schema above).
- Because `persistSession` is enabled in the Supabase client, refresh tokens will keep users signed in across visits.
