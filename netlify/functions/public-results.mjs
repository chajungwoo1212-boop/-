import { getStore } from "@netlify/blobs";
import { getConfig, json } from "./lib/shared.mjs";

export default async (req) => {
  if (req.method !== "GET") {
    return json({ message: "GET 요청만 가능합니다." }, 405);
  }

  try {
    const cfg = getConfig();
    const store = getStore("formlympic");
    const prefix = `${cfg.eventId}/submissions/`;
    const { blobs } = await store.list({ prefix });

    const submissions = (
      await Promise.all(
        blobs.map((blob) =>
          store.get(blob.key, {
            type: "json",
            consistency: "strong",
          })
        )
      )
    ).filter(Boolean);

    submissions.sort((a, b) => {
      if (a.diffMs !== b.diffMs) return a.diffMs - b.diffMs;
      return String(a.requestId || "").localeCompare(String(b.requestId || ""));
    });

    return json({
      count: submissions.length,
      results: submissions.map((row, index) => ({
        rank: index + 1,
        nickname: row.nickname,
        receivedAtKST: row.receivedAtKST,
        diffMs: row.diffMs,
      })),
    });
  } catch (error) {
    console.error(error);
    return json({ message: "순위를 불러오지 못했습니다." }, 500);
  }
};

export const config = {
  path: "/api/public-results",
};
