import { createHash, timingSafeEqual } from "node:crypto";

export function getConfig() {
  const title = process.env.EVENT_TITLE || "DC인사이드 갤러리 폼림픽";
  const eventId = process.env.EVENT_ID || "formlympic-demo";
  const targetRaw = process.env.TARGET_TIME || "";
  const closeAfterMs = Number(process.env.CLOSE_AFTER_MS || 60000);

  const targetMs = Date.parse(targetRaw);

  if (!targetRaw || Number.isNaN(targetMs)) {
    throw new Error(
      "TARGET_TIME 환경변수가 없거나 올바르지 않습니다. 예: 2026-08-25T21:00:00+09:00"
    );
  }

  if (!Number.isFinite(closeAfterMs) || closeAfterMs < 1000) {
    throw new Error("CLOSE_AFTER_MS 환경변수가 올바르지 않습니다.");
  }

  return { title, eventId, targetRaw, targetMs, closeAfterMs };
}

export function normalizeText(value, maxLength) {
  return String(value ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, maxLength);
}

export function hashUid(uid) {
  return createHash("sha256").update(uid, "utf8").digest("hex");
}

export function isAdmin(req) {
  const expected = process.env.ADMIN_KEY || "";
  if (!expected) return false;

  const header = req.headers.get("authorization") || "";
  const supplied = header.startsWith("Bearer ") ? header.slice(7) : "";

  if (!supplied) return false;

  const a = Buffer.from(expected);
  const b = Buffer.from(supplied);
  if (a.length !== b.length) return false;

  return timingSafeEqual(a, b);
}

export function json(data, status = 200, extraHeaders = {}) {
  return Response.json(data, {
    status,
    headers: {
      "Cache-Control": "no-store",
      ...extraHeaders,
    },
  });
}

export function formatKst(ms) {
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    fractionalSecondDigits: 3,
    hour12: false,
  }).format(new Date(ms));
}
