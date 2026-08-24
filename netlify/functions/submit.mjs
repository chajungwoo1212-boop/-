import { getStore } from "@netlify/blobs";
import {
  getConfig,
  normalizeText,
  hashUid,
  json,
  formatKst,
} from "./lib/shared.mjs";

export default async (req, context) => {
  if (req.method !== "POST") {
    return json({ message: "POST 요청만 가능합니다." }, 405);
  }

  // 순위 판정 기준: 함수가 요청을 처리하기 시작한 서버 시각.
  const receivedAtMs = Date.now();

  try {
    const cfg = getConfig();

    if (receivedAtMs < cfg.targetMs) {
      return json({
        message: "아직 이벤트 시작 전입니다.",
        serverTimeMs: receivedAtMs,
        targetMs: cfg.targetMs,
      }, 425);
    }

    if (receivedAtMs > cfg.targetMs + cfg.closeAfterMs) {
      return json({ message: "이벤트가 종료되었습니다." }, 410);
    }

    const body = await req.json();
    const nickname = normalizeText(body.nickname, 30);
    const uid = normalizeText(body.uid, 80);
    const honeypot = normalizeText(body.website, 100);

    if (honeypot) {
      return json({ message: "잘못된 요청입니다." }, 400);
    }

    if (nickname.length < 1 || uid.length < 1) {
      return json({ message: "닉네임과 식별값을 모두 입력해주세요." }, 400);
    }

    const uidHash = hashUid(uid);
    const key = `${cfg.eventId}/submissions/${uidHash}`;
    const diffMs = receivedAtMs - cfg.targetMs;

    const submission = {
      nickname,
      uid,
      receivedAtMs,
      receivedAtISO: new Date(receivedAtMs).toISOString(),
      receivedAtKST: formatKst(receivedAtMs),
      targetMs: cfg.targetMs,
      diffMs,
      requestId: context?.requestId || null,
    };

    const store = getStore("formlympic");
    const { modified } = await store.setJSON(key, submission, {
      onlyIfNew: true,
    });

    if (!modified) {
      return json({ message: "이미 참여한 식별값입니다. 1회만 참여할 수 있습니다." }, 409);
    }

    return json({
      success: true,
      receivedAtMs,
      receivedAtKST: submission.receivedAtKST,
      diffMs,
    });
  } catch (error) {
    console.error(error);
    return json({ message: "서버 오류가 발생했습니다." }, 500);
  }
};

export const config = {
  path: "/api/submit",
};
