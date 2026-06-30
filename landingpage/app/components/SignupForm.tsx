"use client";

import { useState } from "react";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function SignupForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const value = email.trim();
    if (!EMAIL_RE.test(value)) {
      setError("Please enter a valid email address.");
      return;
    }

    // --- Connect your email provider here ---
    // POST `value` to Mailchimp / ConvertKit / Beehiiv, etc.
    // For now we record locally and show the success state.
    try {
      const list = JSON.parse(localStorage.getItem("qw_signups") || "[]");
      list.push({ email: value, at: new Date().toISOString() });
      localStorage.setItem("qw_signups", JSON.stringify(list));
    } catch {
      // ignore storage failures — still show success
    }
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="rounded-[18px] border border-field-line bg-white px-7 py-[26px]">
        <div className="mb-2.5 flex items-center gap-2.5">
          <span className="inline-flex h-[30px] w-[30px] items-center justify-center rounded-full bg-[#e4f0f2]">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M5 13l4 4L19 7"
                stroke="#3e8e5b"
                strokeWidth="2.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          <span className="font-serif text-2xl font-medium text-ink">
            You&apos;re in. Welcome.
          </span>
        </div>
        <p className="m-0 text-[15px] leading-[1.6] text-body">
          The Stillness Collection is on its way to your inbox. Take a breath —
          we&apos;ll be gentle with it.
        </p>
      </div>
    );
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="flex flex-wrap gap-2.5">
        <input
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setError("");
          }}
          placeholder="Your email address"
          aria-label="Your email address"
          className="min-w-0 flex-[1_1_240px] rounded-[30px] border border-field-line bg-white px-[22px] py-4 text-base text-ink outline-none transition focus:border-water focus:shadow-[0_0_0_4px_rgba(156,192,212,0.25)]"
        />
        <button
          type="submit"
          className="flex-none cursor-pointer rounded-[30px] border-none bg-slate px-7 py-4 text-[15px] font-semibold whitespace-nowrap text-[#eaf1f4] transition-colors hover:bg-ink"
        >
          Send me the collection
        </button>
      </form>

      {error && (
        <div className="mt-2.5 pl-1.5 text-[13px] font-medium leading-[1.4] text-[#b07a6a]">
          {error}
        </div>
      )}

      <div className="mt-3.5 flex items-center gap-2 pl-1.5">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M5 13l4 4L19 7"
            stroke="#9cc0d4"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span className="text-[13px] leading-[1.4] text-[#7c8c97]">
          No noise — just a verse when you need it. Unsubscribe anytime.
        </span>
      </div>
    </>
  );
}
