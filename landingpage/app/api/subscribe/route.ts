import { isValidEmail } from "@/lib/email";
import { subscribeToKit } from "@/lib/kit";

export async function POST(request: Request): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }

  const rawEmail =
    body && typeof body === "object" && "email" in body && typeof (body as { email: unknown }).email === "string"
      ? (body as { email: string }).email.trim()
      : "";

  if (!isValidEmail(rawEmail)) {
    return Response.json({ error: "Please enter a valid email address." }, { status: 400 });
  }

  const referrer = request.headers.get("referer") ?? undefined;
  const result = await subscribeToKit({ email: rawEmail, referrer });

  if (!result.ok) {
    console.error("Kit subscribe failed", { status: result.status });
    return Response.json({ error: "Subscription failed. Please try again." }, { status: 502 });
  }

  return Response.json({ ok: true });
}
