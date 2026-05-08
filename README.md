# PrimePM

PrimePM is a PMO command center for project intake, criteria-based selection, portfolio visibility, and schedule planning. The current implementation is a Vite React application backed by Supabase Auth, a Supabase Edge Function API, and a PostgreSQL schema managed with Prisma migrations.

The product is being built around two connected workflows:

- Portfolio governance: define scoring criteria, collect project submissions, score proposals, and give PMO/management a live view of the project pipeline.
- Project scheduling: open an approved or submitted project into a Gantt-style scheduler with tasks, dependencies, resources, assignments, calendars, critical path, and persistence.

## Current Capabilities

- Marketing landing page at `/` and authenticated application routes served from `app.html`.
- Supabase email/password authentication in the React client.
- API mode when `VITE_API_URL` is configured; local scheduler mode when it is not.
- Auto-provisioning of a personal organization and user row on first authenticated API request.
- Portfolio dashboard with project counts, budget totals, effort totals, status breakdowns, and top scored projects.
- Project list and detail views with edit, delete, and schedule entry points.
- Project submission wizard with project facts, department selection, tags, budget, mandays, self-assessment, and weighted score calculation.
- Criteria/version management with active versions, score ranges, criteria CRUD, rubrics, and AHP pairwise weighting.
- Pure TypeScript scheduling engine with task hierarchy, FS/SS/FF/SF dependencies, lag/lead, date constraints, cycle detection, summary rollups, critical path, and working calendar support.
- Interactive scheduler with grid/Gantt split view, task inspector, dependency editing, command palette, keyboard shortcuts, templates, undo/redo, resource planning, utilization, and cost breakdowns.
- Debounced persistence to local storage in standalone mode or to the API-backed schedule tables in authenticated mode.
- Database groundwork for committee review, portfolio selections, portfolio simulations, audit logs, and schedule-specific entities.

## In Progress

The schema already includes committee review and portfolio simulation entities, and the UI has placeholder navigation for several future PMO modules. The main areas still being built are:

- Committee review screens and scoring workflows.
- Portfolio simulation and final selection workflows.
- Strategic objectives, risk and issue tracking, cross-project dependencies, benefits/ROI, executive briefings, steering committee reports, and stage-gate calendars.
- Production hardening around authorization, role-based experiences, and seeded tenant setup.

## Architecture

PrimePM is currently a client-rendered SPA plus an Edge Function API.

### Frontend

- Vite builds two HTML entry points: `index.html` for the landing page and `app.html` for the application shell.
- React 19 renders the app from `src/main.tsx` and `src/App.tsx`.
- Routing is handled by a small custom path router in `src/lib/router.ts`.
- Application pages live under `src/pages`.
- Shared UI, layout, Gantt, grid, resource, command, and scheduler components live under `src/components`.
- Scheduler state is held in a Zustand/Immer store in `src/store/projectStore.ts`.
- Scheduling calculations are isolated in the pure domain engine under `src/engine`.
- Styling uses Tailwind CSS 4, project tokens in `src/styles/pp-tokens.css`, and component-level CSS variables.

### API

- The API is a Hono app in `supabase/functions/api`.
- API routes are mounted under `/api/*` and deployed as a Supabase Edge Function.
- Edge Function imports are pinned in `supabase/functions/api/deno.json`.
- The client calls the API through `src/api/client.ts` and sends the Supabase access token in the `Authorization` header.
- The API validates Supabase JWTs with JWKS, with an optional HS256 fallback for legacy JWT secrets.
- Data access uses `postgres` tagged SQL in the Edge Function rather than Prisma Client at runtime.
- Current route modules cover projects, project snapshots, schedule tasks, dependencies, resources, assignments, calendars, settings, dashboard data, criteria, departments, and project submissions.

### Database

- Prisma owns the schema and migrations in `prisma/schema.prisma` and `prisma/migrations`.
- PostgreSQL models cover organizations, users, departments, criteria versions, criteria, AHP pairwise comparisons, projects, self-assessment scores, committee scores, portfolio selections, portfolio simulations, audit logs, and schedule tables.
- Schedule tables store tasks, dependencies, resources, assignments, calendars, settings, task order, resource order, and collapsed state.
- Scheduling table migrations enable row-level security policies scoped through the authenticated user's organization membership.

### Deployment

- Web builds target Vite output in `dist`.
- `wrangler.toml` is configured for Cloudflare Pages with `pages_build_output_dir = "dist"`.
- `npm run deploy:web` builds the app and deploys `dist` to Cloudflare Pages.
- `npm run deploy:fn` deploys the Supabase Edge Function API.
- `netlify.toml` is still present from an earlier deployment path and does not match the current Vite/Cloudflare build target.

## Application Routes

- `/`: landing page.
- `/login`: sign in and sign up.
- `/dashboard`: API-backed PMO dashboard.
- `/projects`: project list.
- `/projects/new`: project submission wizard.
- `/projects/:id`: project detail view.
- `/projects/:id/edit`: project edit route alias.
- `/p/:id`: scheduler for a project.
- `/selection`: criteria versions, criteria, rubrics, and AHP weighting.
- `/dashboard-soon`, `/ongoing-soon`, and `/soon/:kind`: design/prototype placeholders for upcoming modules.

## Tech Stack

- React 19
- Vite 6
- TypeScript 5
- Tailwind CSS 4
- Zustand with Immer
- Supabase Auth and Supabase Edge Functions
- Deno for the Supabase Edge Function runtime
- Hono for the Edge Function API
- PostgreSQL with Prisma schema/migrations
- `postgres` for runtime SQL in the Edge Function
- Zod for API validation
- Recharts for charting
- Lucide React for icons
- Vitest for engine tests
- Cloudflare Pages for the current web deployment target

## Getting Started

### Prerequisites

- Node.js 20 or newer.
- npm.
- Supabase CLI for local function development or function deployment.
- Wrangler CLI for Cloudflare Pages deployment.
- Access to a Supabase project or PostgreSQL database for API-backed mode.

### Install

```bash
npm install
```

### Run The Frontend

```bash
npm run dev
```

Vite serves the app at `http://localhost:5173`.

- Open `http://localhost:5173` for the landing page.
- Open `http://localhost:5173/app.html` for standalone local scheduler mode.
- App routes such as `http://localhost:5173/dashboard` are rewritten to `app.html` by the Vite dev middleware.

Without `VITE_API_URL`, the scheduler runs in local-only mode and stores snapshots in browser local storage.

### Environment Variables

Frontend variables:

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-or-publishable-key
VITE_API_URL=https://your-api-origin
```

Edge Function variables:

```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_DB_URL=postgresql://...
DATABASE_URL=postgresql://... # accepted as a fallback
SUPABASE_JWT_SECRET=...       # optional fallback for legacy HS256 tokens
ALLOWED_ORIGINS=https://your-web-origin,https://*.your-preview-domain.pages.dev
```

Prisma uses `DATABASE_URL` from `.env` through `prisma.config.ts`.

## Database Workflow

Generate the Prisma client:

```bash
npm run db:generate
```

Apply migrations in development:

```bash
npm run db:migrate:dev
```

Apply migrations in production or CI:

```bash
npm run db:migrate:deploy
```

Preview schema drift as SQL:

```bash
npm run db:diff
```

Seed SQL and historical migration notes live under `prisma/migrations`.

## API Development

The deployed API function is `supabase/functions/api/index.ts`.

Deploy it with:

```bash
npm run deploy:fn
```

The Supabase function config currently disables platform JWT verification for the function because the Hono app validates JWTs itself in `supabase/functions/api/lib/auth.ts`.

## Build And Preview

Build the frontend:

```bash
npm run build
```

Preview the production build locally:

```bash
npm run preview
```

Run tests:

```bash
npm test
```

Deploy the web app to Cloudflare Pages:

```bash
npm run deploy:web
```

## Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Start the Vite development server. |
| `npm run build` | Type-check and build the Vite app. |
| `npm run preview` | Preview the production build locally. |
| `npm test` | Run Vitest tests. |
| `npm run db:generate` | Generate Prisma Client from the schema. |
| `npm run db:migrate:dev` | Run Prisma development migrations. |
| `npm run db:migrate:deploy` | Apply Prisma migrations in deployment environments. |
| `npm run db:diff` | Print a SQL diff from the configured database to the Prisma schema. |
| `npm run deploy:fn` | Deploy the Supabase Edge Function API. |
| `npm run deploy:web` | Build and deploy the Vite app to Cloudflare Pages. |

## Project Structure

```text
src/
   api/                 Frontend API client and wire types
   auth/                Supabase client, auth provider, and login page
   components/          Layout, UI, Gantt, grid, resources, commands, templates
   engine/              Pure scheduling engine and tests
   lib/                 Scoring, routing, date, formatting, theme, and utility helpers
   pages/               Dashboard, project list/detail, submission, selection, soon pages
   store/               Zustand project store and persistence layer
   styles/              Design tokens
   templates/           Scheduler starter templates
supabase/functions/api/
   deno.json            Edge Function import map
   index.ts             Hono API entry point
   lib/                 Auth, database, audit, errors, validation
   routes/              Project, schedule, dashboard, criteria, department, submission routes
prisma/
   schema.prisma        Database schema
   migrations/          SQL migrations and seed artifacts
public/
   _redirects           SPA route rewrites for static hosting
```

## Notes For Contributors

- Keep scheduler domain logic inside `src/engine` free of React and browser dependencies.
- Keep API payload shapes synchronized between `src/api/types.ts`, `src/api/client.ts`, and the Hono route validators.
- When adding API-backed scheduler behavior, support the local storage fallback where practical.
- Prefer adding Prisma migrations for schema changes, while remembering that the Edge Function runtime uses SQL directly.
- Treat committee review and portfolio simulation as partially implemented: the schema is present, but the full frontend and API workflows are still underway.
