import { getStore } from "@netlify/blobs";
import { getConfig, isAdmin, json } from "./lib/shared.mjs";

export default async (req) => {
  if (req.method !== "GET") {
    return json({ message: "GET 요청만 가능합니다." }, 405);
  }

  if (!process.env.ADMIN_KEY) {
    return json({
      message: "ADMIN_KEY 환경변수가 설정되지 않아 관리자 기능이 비활성화되어 있습니다."
    }, 503);
  }

  if (!isAdmin(req)) {
    return json({ message: "관리자 인증에 실패했습니다." }, 401);
  }

  try {
    const cfg = getConfig();
    const store = getStore("formlympic");
    const prefix = `${cfg.eventId}/submissions/`;
    const { blobs } = await store.list({ prefix });

    const submissions = (
      await Promise.all(
        blobs.map((blob) => store.get(blob.key, {
          type: "json",
          consistency: "strong",
        }))
      )
    ).filter(Boolean);

    submissions.sort((a, b) => {
      if (a.diffMs !== b.diffMs) return a.diffMs - b.diffMs;
      return String(a.requestId || "").localeCompare(String(b.requestId || ""));
    });

    let previousDiff = null;
    let currentRank = 0;

    const results = submissions.map((row, index) => {
      if (previousDiff === null || row.diffMs !== previousDiff) {
        currentRank = index + 1;
        previousDiff = row.diffMs;
      }

      return {
        rank: currentRank,
        nickname: row.nickname,
        uid: row.uid,
        receivedAtMs: row.receivedAtMs,
        receivedAtKST: row.receivedAtKST,
        diffMs: row.diffMs,
        requestId: row.requestId,
      };
    });

    return json({
      title: cfg.title,
      eventId: cfg.eventId,
      targetTime: cfg.targetRaw,
      count: results.length,
      results,
    });
  } catch (error) {
    console.error(error);
    return json({ message: "결과를 불러오지 못했습니다." }, 500);
  }
};

export const config = {
  path: "/api/results",
};
