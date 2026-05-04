/**
 * UUID v4 generator. We use UUIDs (not prefixed nanoids) because the backend
 * stores IDs as Postgres UUID columns. The `prefix` argument is accepted for
 * call-site readability but is no longer included in the generated value.
 */
export function newId(_prefix?: string): string {
  // crypto.randomUUID() is available in all modern browsers, Node 19+, Deno, Workers.
  return crypto.randomUUID();
}
