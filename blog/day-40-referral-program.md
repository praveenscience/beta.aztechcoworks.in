# Day 40: The Referral Program — Word-of-Mouth as a Growth Engine

**Series:** Building a Production SaaS in Public — 45 Days, 45 Posts
**Tags:** #buildinpublic #referral #growth #coworking #saas

---

Every member gets a referral code. Share it. When someone signs up using it, both parties benefit. The cheapest acquisition channel for a coworking business.

## The Code

Every user gets a referral code on creation:

```typescript
referralCode: `${name.split(" ")[0].toUpperCase().slice(0, 6)}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`
```

"Praveen Kumar" → "PRAVEE-X7K9". Human-readable prefix (your first name) + random suffix (uniqueness).

The code is displayed on the member dashboard overview (visibility = usage) and on the dedicated referrals page.

## The Referral Page

`/dashboard/referrals` shows the member their code, a share mechanism, and their referral history. Currently client-side only (Zustand + localStorage) because the referral tracking API isn't built yet.

The data model is ready:

```typescript
export interface Referral {
  id: string;
  referrerUserId: string;    // Who shared the code
  referredLeadId: string;    // The lead who used it
  status: "pending" | "converted" | "rewarded";
  rewardAmount: number;
}
```

When the referral API is built, the flow will be:
1. Lead fills out a form with a referral code
2. Backend creates a Referral with `status: "pending"`
3. Lead converts to member → status changes to `"converted"`
4. Reward is credited → status changes to `"rewarded"`

## Why Referrals Matter for Coworking

Customer acquisition cost (CAC) for a coworking space:
- Google Ads: ₹2,000-5,000 per lead
- Sales team outreach: ₹1,500-3,000 per lead
- Referral: ₹500-1,000 (the reward amount)

A ₹500 referral reward converts at 3x the rate of a cold lead because the prospect trusts the referrer. Lower cost, higher conversion. The math is obvious.

Putting the referral code on the main dashboard (not buried in settings) is a deliberate product decision. Visibility drives usage.

---

**Tomorrow:** Day 41 — The Blog System: Content as a Feature

**LinkedIn post:**

> Every member gets a referral code: PRAVEE-X7K9
>
> It's on the dashboard overview. Not in settings. Not in "Account." On the first screen they see.
>
> Visibility = Usage.
>
> Referral CAC: ₹500-1,000
> Google Ads CAC: ₹2,000-5,000
> Referral conversion: 3x cold leads
>
> The cheapest growth channel is the one your customers run for you.
>
> Day 40 of 45: [link]

**X post:**

> Referral code on the main dashboard. Not in settings. First screen.
>
> Visibility = Usage.
>
> Referral CAC: ₹500. Google Ads CAC: ₹3,000. Referral converts 3x better.
>
> Put your growth lever where users can see it.
>
> Day 40/45
