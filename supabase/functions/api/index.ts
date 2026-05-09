import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { requireAuth } from './lib/auth.ts';
import { projectsRoutes } from './routes/projects.ts';
import { snapshotRoutes } from './routes/snapshot.ts';
import { tasksRoutes } from './routes/tasks.ts';
import { dependenciesRoutes } from './routes/dependencies.ts';
import { resourcesRoutes } from './routes/resources.ts';
import { assignmentsRoutes } from './routes/assignments.ts';
import { calendarRoutes } from './routes/calendar.ts';
import { settingsRoutes } from './routes/settings.ts';
import { dashboardRoutes } from './routes/dashboard.ts';
import { criteriaRoutes } from './routes/criteria.ts';
import { departmentsRoutes } from './routes/departments.ts';
import { submissionRoutes } from './routes/submission.ts';
import { baselineRoutes } from './routes/baselines.ts';

const app = new Hono();

app.use(
  '*',
  cors({
    origin: (origin) => {
      if (!origin) return null;
      // Always allow local development
      if (origin.startsWith('http://localhost') || origin.startsWith('http://127.0.0.1')) return origin;
      const allowed = (Deno.env.get('ALLOWED_ORIGINS') ?? '').split(',').map(s => s.trim()).filter(Boolean);
      for (const pattern of allowed) {
        // Support wildcard subdomain patterns, e.g. https://*.primepmdev.pages.dev
        if (pattern.includes('*')) {
          const escaped = pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\\\*/g, '[^.]+');
          if (new RegExp(`^${escaped}$`).test(origin)) return origin;
        } else if (origin === pattern) {
          return origin;
        }
      }
      return null;
    },
    allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Authorization', 'Content-Type'],
    maxAge: 600,
  }),
);

app.onError((err, c) => {
  console.error('Unhandled error', err);
  const message = err instanceof Error ? err.message : String(err);
  const stack = err instanceof Error ? err.stack : undefined;
  return c.json({ error: 'internal_error', message, stack }, 500);
});

app.get('/api/health', c => c.json({ ok: true, ts: Date.now() }));

// All authenticated routes
app.use('/api/projects', requireAuth);
app.use('/api/projects/*', requireAuth);
app.use('/api/dashboard', requireAuth);
app.use('/api/criteria', requireAuth);
app.use('/api/criteria/*', requireAuth);
app.use('/api/departments', requireAuth);

const api = new Hono();
api.route('/', projectsRoutes);
api.route('/', snapshotRoutes);
api.route('/', tasksRoutes);
api.route('/', dependenciesRoutes);
api.route('/', resourcesRoutes);
api.route('/', assignmentsRoutes);
api.route('/', calendarRoutes);
api.route('/', settingsRoutes);
api.route('/', dashboardRoutes);
api.route('/', criteriaRoutes);
api.route('/', departmentsRoutes);
api.route('/', submissionRoutes);
api.route('/', baselineRoutes);

app.route('/api', api);

Deno.serve(app.fetch);
