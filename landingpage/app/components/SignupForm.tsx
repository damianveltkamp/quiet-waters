"use client";

import { useState } from "react";
import { usePostHog } from "posthog-js/react";
import { isValidEmail } from "@/lib/email";

export default function SignupForm() {
  const posthog = usePostHog();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const value = email.trim();
    if (!isValidEmail(value)) {
      setError("Please enter a valid email address.");
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: value }),
      });
      if (!res.ok) {
        throw new Error("subscribe failed");
      }
      posthog?.capture("signup_submitted");
      setSubmitted(true);
    } catch {
      setError("Something went wrong on our end. Please try again in a moment.");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="rounded-[18px] border border-field-line bg-white px-7 py-[26px]">
        <div className="mb-2.5 flex items-center gap-2.5">
          <span className="inline-flex h-[30px] w-[30px] items-center justify-center rounded-full bg-[#e4f0f2]">
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
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
          Check your inbox to confirm your email — then The Stillness Collection
          is on its way. Take a breath; we&apos;ll be gentle with it.
        </p>
      </div>
    );
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="flex flex-col flex-wrap gap-2.5">
        <input
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setError("");
          }}
          placeholder="Your email address"
          aria-label="Your email address"
          disabled={submitting}
          className="min-w-0 flex-1 rounded-[30px] border border-field-line bg-white px-[22px] py-4 text-base text-ink outline-none transition focus:border-water focus:shadow-[0_0_0_4px_rgba(156,192,212,0.25)] disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={submitting}
          className="w-fit flex-none cursor-pointer rounded-[30px] border-none bg-slate px-7 py-4 text-[15px] font-semibold whitespace-nowrap text-[#eaf1f4] transition-colors hover:bg-ink disabled:cursor-not-allowed disabled:opacity-70"
        >
          {submitting ? "Sending…" : "Get the lords scripture"}
        </button>
      </form>

      <p className="mt-2.5 pl-1.5 text-[12px] leading-[1.4] text-muted">
        We&apos;ll send occasional emails. Unsubscribe anytime.
      </p>

      {error && (
        <div className="mt-2.5 pl-1.5 text-[13px] font-medium leading-[1.4] text-[#b07a6a]">
          {error}
        </div>
      )}
    </>
  );
}
