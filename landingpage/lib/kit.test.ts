import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { subscribeToKit } from "@/lib/kit";

const API = "https://api.kit.com/v4";

describe("subscribeToKit (v4)", () => {
  beforeEach(() => {
    process.env.KIT_API_KEY = "kit_test";
    process.env.KIT_FORM_ID = "9999";
    vi.restoreAllMocks();
  });

  afterEach(() => {
    delete process.env.KIT_API_KEY;
    delete process.env.KIT_FORM_ID;
  });

  it("upserts the subscriber then adds them to the form, returning ok", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ subscriber: { id: 123 } }), { status: 200 }),
      )
      .mockResolvedValueOnce(new Response("{}", { status: 200 }));

    const result = await subscribeToKit({
      email: "a@b.com",
      referrer: "https://quietwaters.app/?utm_source=instagram",
    });

    expect(result).toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledTimes(2);

    // Call 1: upsert subscriber
    const [url1, init1] = fetchMock.mock.calls[0];
    expect(url1).toBe(`${API}/subscribers`);
    expect(init1?.method).toBe("POST");
    expect((init1?.headers as Record<string, string>)["X-Kit-Api-Key"]).toBe("kit_test");
    expect(JSON.parse((init1?.body as string) ?? "{}")).toEqual({ email_address: "a@b.com" });

    // Call 2: add to form
    const [url2, init2] = fetchMock.mock.calls[1];
    expect(url2).toBe(`${API}/forms/9999/subscribers/123`);
    expect(init2?.method).toBe("POST");
    expect((init2?.headers as Record<string, string>)["X-Kit-Api-Key"]).toBe("kit_test");
    expect(JSON.parse((init2?.body as string) ?? "{}")).toEqual({
      referrer: "https://quietwaters.app/?utm_source=instagram",
    });
  });

  it("returns the create status and skips the form call when upsert fails", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(new Response("{}", { status: 422 }));

    const result = await subscribeToKit({ email: "a@b.com" });

    expect(result).toEqual({ ok: false, status: 422 });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("returns 502 when the upsert response has no subscriber id", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({ subscriber: {} }), { status: 200 }),
    );

    const result = await subscribeToKit({ email: "a@b.com" });
    expect(result).toEqual({ ok: false, status: 502 });
  });

  it("returns the form status when the add-to-form call fails", async () => {
    vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ subscriber: { id: 5 } }), { status: 200 }),
      )
      .mockResolvedValueOnce(new Response("{}", { status: 404 }));

    const result = await subscribeToKit({ email: "a@b.com" });
    expect(result).toEqual({ ok: false, status: 404 });
  });

  it("returns 500 when env vars are missing", async () => {
    delete process.env.KIT_API_KEY;
    const result = await subscribeToKit({ email: "a@b.com" });
    expect(result).toEqual({ ok: false, status: 500 });
  });
});
