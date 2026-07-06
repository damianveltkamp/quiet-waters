const KIT_FORMS_URL = "https://api.convertkit.com/v3/forms";

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

  const res = await fetch(`${KIT_FORMS_URL}/${formId}/subscribe`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      api_key: apiKey,
      email: params.email,
      referrer: params.referrer,
    }),
  });

  return res.ok ? { ok: true } : { ok: false, status: res.status };
}
