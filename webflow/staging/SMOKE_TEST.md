# SMOKE TEST — run on the Webflow page after pasting

Handoff artifact. Run every check on the live Webflow staging page. Mobile is the
priority surface — test mobile portrait first, then desktop. Do not change any
canonical file to "fix" a failure here; fix the embed/config and re-test.

## 0. Load / assets
- [ ] Page loads with **no console errors**.
- [ ] All 13 CSS + 2 JS load (no 404s in the Network tab); `?v=N` present.
- [ ] Cards render — not "Failed to load videos" (data index URL resolves).
- [ ] Visual skin applied (skin CSS is last; page styling looks final, not raw).

## 1. Memberstack / auth resolve
- [ ] Page has the Memberstack integration active (`window.$memberstackDom` exists).
- [ ] Exactly **one** Memberstack instance loaded (no duplicate loader added).
- [ ] Anonymous visitor (logged out) → treated as Free; `#sm-library-scope` has
      `sm-anon` + `sm-free`; badge reads `Basic`.

## 2. Free tier (logged out, or logged-in Free member)
- [ ] First **7 moves + 2 plans** are unlocked and openable.
- [ ] Everything else is **locked-but-visible** (not hidden).
- [ ] Packs are gated; **Saved** tab shows the Pro upsell message (not a list).
- [ ] Logged-in Free has `sm-authed` + `sm-free`.
- [ ] Click a locked move/plan → Pro pricing modal opens (`smOpenProModal`).
- [ ] Click a gated pack → Pack value modal opens (`smPackModal`), and its
      "unlock" button forwards to the pricing modal.
- [ ] Checkout is deferred: no Stripe/checkout fires; CTA falls back to sign-up
      URL (anonymous) or leaves the upgrade modal open (logged-in Free).

## 3. Pro tier (real Pro Memberstack login)
- [ ] Everything unlocks; badge reads `PRO`; scope has `sm-authed` + `sm-pro`.
- [ ] Pro plan id matches the gating constant (`PRO_PLAN_ID`, index.html:1412).

## 4. Player (move / plan video)
- [ ] Move card → player modal (`#modal`) opens and closes.
- [ ] Loop is on by default; loop and speed (1× / 0.5×) toggles work.
- [ ] Scroll restores after closing the player.

## 5. Plan Viewer (v3)
- [ ] Plan card → Plan Viewer v3 opens — the real v3, **not** the fallback basic
      viewer (confirms plan-viewer-v3.js loaded after library-pro.js + DOM).
- [ ] Swipe/next-prev between slides; dots work; backdrop + close button work.
- [ ] Plan Viewer renders **above** all other modals/drawers (z-index correct).
- [ ] Open Move Player from inside a plan, then close → plan re-opens correctly
      (event bridge: sm:open-plan / sm:open-move-player / sm:reopen-plan-after-player).
- [ ] Plan Viewer does not occupy vertical space on the page when closed.

## 6. Saved
- [ ] Pro: save / unsave a move → icon updates without reload; persists on revisit.
- [ ] Free: Saved tab shows the Pro message (no saving).

## 7. Tabs / filters
- [ ] All / Moves / Plans / Packs / Saved switch correctly.
- [ ] Filter drawer opens and closes; scroll restores after closing.
- [ ] Last-watched header slot appears after watching a move (desktop).

## 8. Mobile (portrait — priority)
- [ ] One scrollbar only (no double scrollbar on pack detail).
- [ ] Mobile tabs + "Assistant" opener work; filter drawer slides in/out.
- [ ] Open pack detail → Plan Viewer → close → pack detail scroll restores.
- [ ] Plan Viewer dots visible above the home indicator; close button reachable.

## 9. Desktop
- [ ] Layout matches the current baseline (cards grid, header, badge).
- [ ] Nav/footer of the host Webflow page are not restyled unexpectedly
      (watch the global `html, body, *` rules from library-pro.css lines 1-16).

## 10. Cross-flow scroll-lock (regression guard)
- [ ] Pack Detail → Plan Viewer → Move Player → close all → scroll restored.
- [ ] No frozen scroll on mobile after any open/close combination.
