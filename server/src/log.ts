/*
 * Error logging that is useful for debugging and safe for a journal: it says where and why something failed
 * without ever putting entry text in the logs.
 *  - Walks the whole `cause` chain (Drizzle wraps the real Postgres error).
 *  - Drops the "params:" part of Drizzle's message, which lists query values.
 *  - Never prints SyntaxError messages: V8 quotes the offending JSON, which can be decrypted journal data.
 *  - Prints stack frames (file:line) but not the stack's first line, which repeats the message.
 */
type ErrorLike = { name?: unknown; message?: unknown; code?: unknown; cause?: unknown; stack?: unknown };

const MAX_MESSAGE = 300;

function safeMessage(e: ErrorLike): string {
  if (e.name === 'SyntaxError') return '[message withheld: may quote entry data]';
  const raw = typeof e.message === 'string' ? e.message : '';
  return raw.split('\nparams:')[0].replace(/\s+/g, ' ').trim().slice(0, MAX_MESSAGE);
}

function frames(e: ErrorLike): string {
  if (typeof e.stack !== 'string') return '';
  return e.stack
    .split('\n')
    .filter((line) => line.trim().startsWith('at '))
    .slice(0, 4)
    .map((line) => `    ${line.trim()}`)
    .join('\n');
}

export function describeError(err: unknown): string {
  const lines: string[] = [];
  let current: unknown = err;
  for (let depth = 0; current && typeof current === 'object' && depth < 5; depth++) {
    const e = current as ErrorLike;
    const code = typeof e.code === 'string' || typeof e.code === 'number' ? ` [${e.code}]` : '';
    lines.push(`${depth === 0 ? '' : '  caused by: '}${String(e.name ?? 'Error')}${code}: ${safeMessage(e)}`);
    if (depth === 0) {
      const f = frames(e);
      if (f) lines.push(f);
    }
    current = e.cause;
  }
  return lines.join('\n');
}
