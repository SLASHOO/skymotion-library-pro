# SkyMotion Pro Library — Build Notes

## Goal

Build a new SkyMotion Pro Library as a separate clean module.

This is not a direct copy of the old Free Library.  
The old Free Library is used only as a reference for:
- root container approach
- JSON loading
- filters logic
- video player idea
- plan viewer idea
- Memberstack user access
- saved moves backend logic

## Main files

- index.html
- library-pro.css
- library-pro.js
- library-data-pro.json

## Rules

- Vanilla HTML, CSS and JavaScript only.
- No React.
- No npm dependencies for now.
- All UI must live inside #sm-library-pro.
- Code must later be easy to connect to Webflow through one embed.
- Do not hardcode content inside JS if it can live in JSON.
- Keep functions modular.
- Do not rewrite the whole project without approval.

## Pro Library v1 Scope

### Main screen

- Header: Pro Library + PRO badge
- Subtitle: Moves, plans and packs for your shoot.
- Bookmark / Saved icon
- Filter / Shoot Builder button
- Tabs: All, Moves, Plans, Packs, Saved
- Featured Pack section
- Popular Moves section
- Cinematic Plans section

### Filters / Shoot Builder

Pro filters must help the user quickly find what to shoot on location.

Questions:
1. Where are you flying?
2. How much time do you have on location?
3. What are you filming?
4. What type of moves do you want?
5. How confident are you right now?
6. What vibe do you want?

Visual cards should be used where they speed up understanding:
- Location
- Subject
- Vibe if needed

Simple buttons should be used for:
- Time
- Move difficulty
- Confidence

### Pack system

First Pro Pack:
- Journey Pack

Pack includes:
- cover
- title
- description
- moves count
- plans count
- Pro tips
- checklist
- moves inside pack
- plans inside pack

### Saved system

Pro users should be able to save:
- moves
- plans
- packs

Backend later:
- saved_items instead of saved_moves only

### Difficulty badges

Each move should have:
- Basic
- Intermediate
- Advanced