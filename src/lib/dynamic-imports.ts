/* eslint-disable @typescript-eslint/ban-ts-comment */
// Helper for runtime-only dynamic imports. Keeps import strings out of files that are
// checked for Edge compatibility so the checker doesn't statically include Node-only modules.

export async function importRedisImpl(): Promise<unknown> {
  // Runtime-only dynamic import. TypeScript can't/shouldn't resolve Node-only modules here.
  // @ts-ignore - runtime import, skip static type resolution
  return await import('./redis.db');
}

export async function importKvrocksImpl(): Promise<unknown> {
  // Runtime-only dynamic import. TypeScript can't/shouldn't resolve Node-only modules here.
  // @ts-ignore - runtime import, skip static type resolution
  return await import('./kvrocks.db');
}
