// tz-lookup ships no type definitions of its own.
declare module 'tz-lookup' {
  /** Returns the IANA timezone name containing the given coordinate. */
  export default function tzlookup(latitude: number, longitude: number): string
}
