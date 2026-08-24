import { getRuntimeConfig, json } from "./lib/shared.mjs";

export default async () => {
  try {
    const cfg = await getRuntimeConfig();

    return json({
      title: cfg.title,
      eventId: cfg.eventId,
      targetTime: cfg.targetRaw,
      targetMs: cfg.targetMs,
      closeAfterMs: cfg.closeAfterMs,
      serverTimeMs: Date.now(),
    });
  } catch (error) {
    console.error(error);
    return json({ message: error.message }, 503);
  }
};

export const config = {
  path: "/api/config",
};
