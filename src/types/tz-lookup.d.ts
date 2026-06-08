declare module "tz-lookup" {
  /** Returns the IANA timezone id for a coordinate, throws on invalid input. */
  export default function tzlookup(lat: number, lon: number): string;
}
