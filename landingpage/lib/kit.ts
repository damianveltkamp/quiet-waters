const KIT_API_BASE = "https://api.kit.com/v4";

export type KitResult = { ok: true } | { ok: false; status: number };

export async function subscribeToKit(params: {
  email: string;
  referrer?: string;
}): Promise<KitResult> {
  const apiKey = process.env.KIT_API_KEY;
  const formId = process.env.KIT_FORM_ID;

  if (!apiKey || !formId) {
    return { ok: false, status: 500 };
  }

  const headers = {
    "Content-Type": "application/json",
    "X-Kit-Api-Key": apiKey,
  };

  // Step 1: upsert the subscriber (creates if new, updates if existing).
  const createRes = await fetch(`${KIT_API_BASE}/subscribers`, {
    method: "POST",
    headers,
    body: JSON.stringify({ email_address: params.email }),
  });

  if (!createRes.ok) {
    return { ok: false, status: createRes.status };
  }

  const createBody = (await createRes.json()) as {
    subscriber?: { id?: number | string };
  };
  const subscriberId = createBody.subscriber?.id;
  if (subscriberId === undefined || subscriberId === null) {
    return { ok: false, status: 502 };
  }

  // Step 2: add the subscriber to the double opt-in form. This triggers Kit's
  // incentive email, which is both the confirmation (double opt-in) and the
  // wallpaper delivery.
  const formRes = await fetch(
    `${KIT_API_BASE}/forms/${formId}/subscribers/${subscriberId}`,
    {
      method: "POST",
      headers,
      body: JSON.stringify({ referrer: params.referrer }),
    },
  );

  if (!formRes.ok) {
    return { ok: false, status: formRes.status };
  }

  return { ok: true };
}
