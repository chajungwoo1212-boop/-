import { getStore } from "@netlify/blobs";
import {
  getConfig,
  getRuntimeConfig,
  isAdmin,
  json,
} from "./lib/shared.mjs";

export default async (req) => {
  if (!process.env.ADMIN_KEY) {
    return json(
      { message: "ADMIN_KEY 환경변수가 설정되지 않았습니다." },
      503
    );
  }

  if (!isAdmin(req)) {
    return json({ message: "관리자 인증에 실패했습니다." }, 401);
  }

  try {
    const base = getConfig();
    const store = getStore("formlympic");
    const key = `${base.eventId}/settings/event`;

    if (req.method === "GET") {
      const cfg = await getRuntimeConfig();
      return json({
        title: cfg.title,
        eventId: cfg.eventId,
        targetTime: cfg.targetRaw,
        targetMs: cfg.targetMs,
        closeAfterMs: cfg.closeAfterMs,
      });
    }

    if (req.method === "POST") {
      const body = await req.json();
      const targetTime = String(body.targetTime || "").trim();
      const targetMs = Date.parse(targetTime);
      const closeAfterMs = Number(body.closeAfterMs ?? base.closeAfterMs);

      if (!targetTime || Number.isNaN(targetMs)) {
        return json({ message: "날짜/시간 형식이 올바르지 않습니다." }, 400);
      }

      if (!Number.isFinite(closeAfterMs) || closeAfterMs < 1000) {
        return json({ message: "접수시간은 최소 1초 이상이어야 합니다." }, 400);
      }

      await store.setJSON(key, {
        targetTime,
        closeAfterMs,
        updatedAt: new Date().toISOString(),
      });

      return json({
        success: true,
        targetTime,
        targetMs,
        closeAfterMs,
      });
    }

    if (req.method === "DELETE") {
      await store.delete(key);
      const cfg = getConfig();

      return json({
        success: true,
        message: "Netlify 환경변수의 기본시간으로 복원했습니다.",
        targetTime: cfg.targetRaw,
        targetMs: cfg.targetMs,
        closeAfterMs: cfg.closeAfterMs,
      });
    }

    return json({ message: "지원하지 않는 요청입니다." }, 405);
  } catch (error) {
    console.error(error);
    return json({ message: "시간 설정 처리 중 오류가 발생했습니다." }, 500);
  }
};

export const config = {
  path: "/api/admin-settings",
};
