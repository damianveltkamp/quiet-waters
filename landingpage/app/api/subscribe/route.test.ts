import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/subscribe/route";

vi.mock("@/lib/kit", () => ({
  subscribeToKit: vi.fn(),
}));

import { subscribeToKit } from "@/lib/kit";

function postRequest(body: unknown, headers: Record<string, string> = {}) {
  return new Request("http://localhost/api/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
}

describe("POST /api/subscribe", () => {
  beforeEach(() => {
    vi.mocked(subscribeToKit).mockReset();
  });

  it("returns 200 and calls Kit for a valid email", async () => {
    vi.mocked(subscribeToKit).mockResolvedValue({ ok: true });
    const res = await POST(postRequest({ email: "a@b.com" }, { referer: "https://qw.app/?utm_source=tiktok" }));
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ ok: true });
    expect(subscribeToKit).toHaveBeenCalledWith({
      email: "a@b.com",
      referrer: "https://qw.app/?utm_source=tiktok",
    });
  });

  it("returns 400 for an invalid email and does not call Kit", async () => {
    const res = await POST(postRequest({ email: "nope" }));
    expect(res.status).toBe(400);
    expect(subscribeToKit).not.toHaveBeenCalled();
  });

  it("returns 400 for a non-JSON body", async () => {
    const req = new Request("http://localhost/api/subscribe", { method: "POST", body: "not json" });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns 502 when Kit fails", async () => {
    vi.mocked(subscribeToKit).mockResolvedValue({ ok: false, status: 422 });
    const res = await POST(postRequest({ email: "a@b.com" }));
    expect(res.status).toBe(502);
  });
});
