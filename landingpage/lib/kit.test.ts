import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { subscribeToKit } from "@/lib/kit";

describe("subscribeToKit", () => {
  beforeEach(() => {
    process.env.KIT_API_KEY = "test-key";
    process.env.KIT_FORM_ID = "12345";
    vi.restoreAllMocks();
  });

  afterEach(() => {
    delete process.env.KIT_API_KEY;
    delete process.env.KIT_FORM_ID;
  });

  it("posts email + api_key to the form subscribe endpoint and returns ok", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response(JSON.stringify({ subscription: {} }), { status: 200 }));

    const result = await subscribeToKit({
      email: "a@b.com",
      referrer: "https://quietwaters.app/?utm_source=instagram",
    });

    expect(result).toEqual({ ok: true });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.convertkit.com/v3/forms/12345/subscribe");
    expect(init?.method).toBe("POST");
    const body = JSON.parse((init?.body as string) ?? "{}");
    expect(body.api_key).toBe("test-key");
    expect(body.email).toBe("a@b.com");
    expect(body.referrer).toBe("https://quietwaters.app/?utm_source=instagram");
  });

  it("returns the status on a Kit error response", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("{}", { status: 422 }));
    const result = await subscribeToKit({ email: "a@b.com" });
    expect(result).toEqual({ ok: false, status: 422 });
  });

  it("returns status 500 when env vars are missing", async () => {
    delete process.env.KIT_API_KEY;
    const result = await subscribeToKit({ email: "a@b.com" });
    expect(result).toEqual({ ok: false, status: 500 });
  });
});
