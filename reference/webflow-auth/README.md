# Webflow auth pages — repo mirror

These are copies of the **custom code embedded in the Webflow pages** for auth.
They live here so we can see the whole picture and edit redirect/plan logic
before pasting back into Webflow. They are NOT loaded by the Pro Library app.

## Files
- `login.html` — Webflow **Log in** page (`#sm-login-v4`)
- `signup.html` — Webflow **Sign up** page (`#sm-signup-page`)

## How it works (Memberstack DOM SDK)
- Login: `loginMemberEmailPassword`, Google (`data-ms-auth-provider="google"`),
  `sendMemberResetPasswordEmail`. On success → redirect.
- Signup: `signupMemberEmailPassword`, Google, custom fields
  (`name`, `username`, `product_updates`), terms gate. On success → redirect.
- Both poll `getCurrentMember()` to confirm the session before redirecting, and
  rewrite Memberstack's raw error text into friendly messages.
- Login page also auto-redirects if the visitor is already logged in
  (on load / focus / visibilitychange / pageshow).

## Route by plan after auth — DONE (in JS)
Both embeds now redirect by Memberstack plan, read from `member.planConnections`:
- Pro plan `pln_skymotion-pro-beta-r8ai0gbb` → `/pro-library`
- everyone else → `/library`

Login: `PRO_PLAN_ID` / `PRO_REDIRECT` / `FREE_REDIRECT` + `hasProPlan()` + `goHome(member)`.
Signup: `CONFIG.proPlanId` / `proRedirect` / `freeRedirect` + `hasProPlan()` + `redirectToLibrary(member)`.

Memberstack's native plan-level redirects are also set in the dashboard as a
fallback (and for pure-native flows). The JS is authoritative because these
embeds log in via the SDK with `preventDefault`, so native post-login redirects
do not fire for email/password.

> After editing here, paste the updated embeds back into the Webflow Login / Sign up pages.

## Still pending
1. **Assign the FREE Memberstack plan on signup** (optional) — `CONFIG.freePlanId`
   is empty. If "Default Settings" is auto-assigned to all members, not needed.
2. **Gate the actual content** — a free member who navigates directly to
   `/pro-library` must not see Pro. Use Memberstack Gated Content on the plan, or
   a membership check on the page. (Redirect ≠ protection.)
3. **Logout** — not in these embeds (likely a `data-ms-action="logout"` element in
   the nav/profile). Add that embed here too for the full session cycle.

## Brand note
These pages use accent `#d19b68`; the Pro Library uses `#c99a6e`. Align to one
bronze token for perfect consistency.
