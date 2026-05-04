import postgres from 'postgres';

let _sql: ReturnType<typeof postgres> | null = null;

function getSql(): ReturnType<typeof postgres> {
  if (_sql) return _sql;
  const connectionString =
    Deno.env.get('SUPABASE_DB_URL') ??
    Deno.env.get('DATABASE_URL') ??
    '';
  if (!connectionString) {
    throw new Error('SUPABASE_DB_URL or DATABASE_URL must be set');
  }
  _sql = postgres(connectionString, {
    prepare: false,
    max: 5,
    idle_timeout: 20,
    connect_timeout: 10,
  });
  return _sql;
}

// Lazy proxy: callable (for tagged templates) AND has properties (.begin, etc).
// Proxy target must be a function for the `apply` trap to fire.
const dummy = function () {} as unknown as ReturnType<typeof postgres>;

export const sql: ReturnType<typeof postgres> = new Proxy(dummy, {
  apply(_t, _thisArg, args) {
    // Tagged-template invocation: sql`SELECT ...`
    return (getSql() as unknown as (...a: unknown[]) => unknown)(...args);
  },
  get(_t, prop) {
    const target = getSql() as unknown as Record<string | symbol, unknown>;
    const v = target[prop];
    return typeof v === 'function' ? (v as (...a: unknown[]) => unknown).bind(target) : v;
  },
});
