# SkyMotion Project Context

SkyMotion is a web product for beginner drone pilots. It helps users choose drone moves, shot plans, and camera settings before or during a real drone flight.

## Current architecture

- Frontend is hosted in Webflow.
- Main frontend logic is custom HTML/CSS/JS embedded into Webflow pages.
- Backend is FastAPI hosted on Render.
- API base: https://skymotion.onrender.com
- Auth uses Memberstack.
- User identification often uses x-ms-id from Memberstack.
- Media/content is served from BunnyCDN.
- Do not assume React, Next.js, Tailwind, or a normal frontend build system unless explicitly present.

## Important design rule

The current free Library design is the visual baseline.
Do not redesign from scratch.
When building Pro/Premium features, preserve the existing layout ratios, spacing logic, mobile behavior, visual tone, and card system unless I explicitly ask for a redesign.

## Development rules

- Make minimal changes.
- Do not rewrite large files unless necessary.
- Preserve existing working logic.
- Never remove auth checks, API calls, saved moves logic, session logic, profile logic, video loading, mobile fixes, or warning signs unless explicitly requested.
- Explain what changed and why.
- When fixing a bug, first identify the likely cause, then patch only that part.
- For UI changes, prioritize mobile first because most users use SkyMotion on phones.
- For Pro Library, add premium elements on top of the free Library baseline instead of replacing the whole design.

## Product priorities

1. Mobile usability
2. Clear onboarding
3. Fast move discovery on location
4. Plan Viewer clarity
5. Pro/Premium value without overcomplicating the product
6. Stable auth and saved/session flows

## Response format

When making code changes:
1. Brief diagnosis
2. Exact changed section
3. Full corrected code only if requested
4. Risks / what to test