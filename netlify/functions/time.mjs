import { json } from "./lib/shared.mjs";

export default async () => {
  return json({ serverTimeMs: Date.now() });
};

export const config = {
  path: "/api/time",
};
