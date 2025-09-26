declare module 'pako' {
  export function gzip(
    input: string | Uint8Array,
    options?: unknown
  ): Uint8Array;
  export function ungzip(
    input: Uint8Array | ArrayBuffer,
    options?: unknown
  ): Uint8Array | string;
  const pako: {
    gzip: typeof gzip;
    ungzip: typeof ungzip;
  };
  export default pako;
}
