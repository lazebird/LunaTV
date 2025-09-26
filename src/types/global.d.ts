// Global ambient declarations for local dynamic imports
declare module './redis.db' {
  const content: unknown;
  export = content;
}

declare module './kvrocks.db' {
  const content: unknown;
  export = content;
}
