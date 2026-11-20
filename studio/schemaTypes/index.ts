import { obrazovka } from "./obrazovka";

export const schemaTypes = [obrazovka];

/** Documents that exist exactly once — opened directly, never created or deleted. */
export const SINGLETONS = new Set(["obrazovka"]);
