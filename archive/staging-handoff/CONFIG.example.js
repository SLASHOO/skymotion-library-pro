/* ===========================================================================
 * CONFIG.example.js — window.SM_* configuration TEMPLATE
 * ===========================================================================
 * Handoff artifact (placeholders only — no secrets, no live values committed).
 * Canonical reference: index.html lines 8-26.
 *
 * Deploy: copy this block into the Webflow page HEAD, wrapped in <script>…</script>,
 * BEFORE the CSS links and BEFORE any JS. Replace every {{PLACEHOLDER}}.
 *
 * This file configures values only. It does NOT contain or change gating,
 * checkout, Stripe, or billing logic — those live in index.html and stay as-is.
 * =========================================================================== */

/* Backend API base (FastAPI on Render). Used for /v1/me/access, /v1/saved-moves,
   /v1/saved-items. Production value is the existing Render URL. */
window.SM_API_BASE = "{{API_BASE}}";   // e.g. https://skymotion.onrender.com

/* Production data index (moves + plans), served from the CDN.
   In local dev this points at ./library-data-pro.json (test data). For production
   set the CDN index URL. If you OMIT this line entirely, the runtime falls back
   to videos_index_v16.json. The gating injector reads this SAME url to build the
   free set, so it must resolve. */
window.SM_LIBRARY_DATA_URL = "{{DATA_INDEX_URL}}";   // e.g. {{CDN_BASE}}/videos_index_v16.json

/* Checklist background image (CDN asset). */
window.SM_CHECKLIST_PAPER_ASSET_URL = "{{CDN_BASE}}/checklist.png";

/* ---- Pro upgrade (CHECKOUT DEFERRED — leave price id empty) ----------------
 * Intentionally NOT configured in this handoff. While SM_PRO_PRICE_ID is empty,
 * logged-in Free users fall back to the sign-up URL; no Stripe/Memberstack
 * checkout fires. Do not set a price id or wire billing as part of this handoff. */
window.SM_PRO_PRICE_ID = "";                       // leave empty (deferred)
window.SM_PRO_SIGNUP_URL = "{{SIGNUP_URL}}";       // e.g. https://skymotion.cloud/sign-up

/* ---- Pack copy / assets (placeholder until the first official pack is chosen) */
window.SM_PRO_PACK_TITLE = "{{PACK_TITLE}}";             // e.g. "Test Pack"
window.SM_PRO_PACK_CREATOR = "{{PACK_CREATOR}}";         // e.g. "Creator Name"
window.SM_PRO_PACK_DESCRIPTION = "{{PACK_DESCRIPTION}}"; // short pack blurb
// window.SM_REAL_ESTATE_PACK_COVER_URL = "{{PACK_COVER_URL}}";  // optional cover image

/* ---------------------------------------------------------------------------
 * Pro plan id NOTE (not set here): the Memberstack Pro plan id is hard-coded in
 * the gating injector at index.html line 1412 (PRO_PLAN_ID =
 * "pln_skymotion-pro-beta-r8ai0gbb"). If the production Pro plan id differs,
 * update that ONE constant in index.html — do not add a competing value here.
 * --------------------------------------------------------------------------- */
