# Services & Tooling

A reference for the external services powering Quiet Waters, so we don't lose track of
where things are configured. Focused on the **email / waitlist stack** for now — extend
as we add more services.

Last updated: 2026-07-06

---

## Domain

| | |
|---|---|
| **Domain** | `thequietwaters.com` |
| **Registrar / DNS** | [TransIP](https://www.transip.nl) |
| **Where to manage DNS** | TransIP control panel → **Domains → `thequietwaters.com` → DNS tab** |
| **Notes** | Domain is newly registered (2026) — sending reputation is still building, so warm up email volume gradually. |

---

## Email address — `hello@thequietwaters.com`

We do **not** pay for a mailbox. The address is a free **forward** that lands in Gmail.

| | |
|---|---|
| **Service** | [ImprovMX](https://improvmx.com) (free plan) |
| **What it does** | Forwards mail sent to `hello@thequietwaters.com` → `thequietwatersapp@gmail.com` |
| **Dashboard** | https://app.improvmx.com — log in, domain `thequietwaters.com` |
| **Personal inbox for reading** | `thequietwatersapp@gmail.com` (Gmail) |
| **Free plan limits** | 25 aliases, 500 forwards/day |

**Why ImprovMX and not ForwardEmail:** ForwardEmail blocked our free signup because the
domain was newly registered (anti-abuse rule). ImprovMX has no domain-age restriction.

**Reply behaviour (current):** we read replies in Gmail. We do **not** yet send replies
*as* `hello@thequietwaters.com` — that requires paid SMTP (Gmail "Send mail as"). Revisit
at launch if branded replies matter. Cheapest options then: ForwardEmail (~$3/mo) once the
domain has aged, or ImprovMX Premium ($9/mo).

### DNS records added at TransIP for ImprovMX

| Naam | Type | Priority | Waarde |
|------|------|----------|--------|
| `@` | MX | 10 | `mx1.improvmx.com.` |
| `@` | MX | 20 | `mx2.improvmx.com.` |
| `@` | TXT | — | `v=spf1 include:spf.improvmx.com ~all` |

> The SPF record replaced TransIP's default empty `v=spf1 ~all`. There must only ever be
> **one** `v=spf1` TXT record on the root — if we add another sender later, merge its
> `include:` into this same line, don't create a second SPF record.

---

## Email marketing / waitlist — KIT

| | |
|---|---|
| **Service** | [KIT](https://kit.com) (formerly ConvertKit) |
| **Used for** | Collecting waitlist emails from the landing page + sending confirmation / wallpaper emails |
| **Dashboard** | https://app.kit.com |
| **Sending (From) address** | `hello@thequietwaters.com` — **set as Default** |
| **Reply-to** | `hello@thequietwaters.com` |
| **Sending domain** | `thequietwaters.com` — authenticated (DKIM/return-path CNAMEs set at TransIP) |

**Deliverability note:** the original spam problem was caused by KIT sending from a
`@gmail.com` address, which can't be authenticated. Fixed by sending from the authenticated
`hello@thequietwaters.com` instead. The old Gmail from-address was removed from KIT.

**Verifying an email is clean:** send a test broadcast to Gmail → open it → **⋮ → "Show
original"** → confirm **SPF: PASS, DKIM: PASS, DMARC: PASS** and that it lands in Inbox.

---

## How it all fits together

```
User signs up on landing page
        │
        ▼
   KIT (list + sends confirmation / wallpaper email)
        │  sends FROM hello@thequietwaters.com
        │  authenticated via DKIM/SPF on thequietwaters.com (DNS at TransIP)
        ▼
   User's inbox  ──(user replies)──►  hello@thequietwaters.com
                                              │  ImprovMX forward
                                              ▼
                                   thequietwatersapp@gmail.com  (we read here)
```
