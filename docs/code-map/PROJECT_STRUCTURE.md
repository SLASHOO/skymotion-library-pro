# PROJECT STRUCTURE — SkyMotion Pro Library

## Стек

- **Frontend:** Webflow + custom HTML/CSS/JS (vanilla, без npm/React/Tailwind)
- **Backend:** FastAPI на Render (`https://skymotion.onrender.com`)
- **Auth:** Memberstack (`window.$memberstackDom` / `window.$memberstack`)
- **Media/CDN:** BunnyCDN (`https://skymotion-cdn.b-cdn.net`)
- **Дані moves/plans:** CDN JSON (`videos_index_v16.json`)
- **Дані packs:** локальний `library-data-pro.json` (тестові дані)

---

## Файли репозиторію

| Файл | Рядків | Роль |
|---|---|---|
| `index.html` | 118 | Dev shell: DOM скелет, конфігурація, порядок завантаження |
| `library-pro.js` | ~4257 | Весь runtime бібліотеки (один IIFE) |
| `library-pro.css` | ~16000+ | Всі стилі: бібліотека + embedded Plan Viewer CSS |
| `plan-viewer-v3.js` | ~983 | Plan Viewer v3 (окремий IIFE) |
| `plan-viewer-v3.css` | ~930 | Стилі Plan Viewer v3 (standalone) |
| `library-data-pro.json` | ~210 | Тестові moves, plans, packs |
| `docs/changelog.md` | — | Журнал змін |
| `docs/notes.md` | — | Нотатки по проєкту |

---

## DOM-структура (index.html)

Три незалежних DOM-блоки:

```
<body>
  #sm-library-scope.sm          ← вся Pro Library (assistant + results + modal)
    #sm-library-scope .library
      .sm-pro-mobile-top         ← mobile header
      .sm-pro-mobile-tabs        ← All/Moves/Plans/Packs/Saved
      #assistantBackdrop
      aside.assistant            ← filters drawer
      main.results
        #resultsHead
        #resultsGrid             ← JS рендерить картки сюди
        #moreBtn
    #modal                       ← відеоплеєр (всередині scope)
      #modalBackdrop
      #modalContent

  [library-pro.js завантажено]

  #sm-plan-v3-root               ← Plan Viewer v3 (ПОЗА scope)
    #spv3Modal.spv3
      #spv3Backdrop
      .spv3__dialog
        #spv3Close
        #spv3Viewport
          #spv3Track
        #spv3Dots

  [plan-viewer-v3.js завантажено]
</body>
```

---

## Порядок завантаження

```
<head>
  library-pro.css?v=121      → стилі бібліотеки + embedded plan viewer CSS
  plan-viewer-v3.css?v=1     → standalone plan viewer CSS

<body>
  [DOM бібліотеки]
  library-pro.js?v=121       → встановлює window.__SM_LIBRARY_V1_CLEAN_SPLIT__ = true
                                 ensureBasicPlanViewer() викликається тут
  [#sm-plan-v3-root HTML]    → DOM-елементи план-в'юера вже є
  plan-viewer-v3.js?v=1      → знаходить DOM, встановлює window.SMPlanViewerV3
```

**Важливо:** `plan-viewer-v3.js` має завантажуватись ПІСЛЯ `#sm-plan-v3-root` HTML і ПІСЛЯ `library-pro.js`. Інакше `ensureBasicPlanViewer()` встигне створити fallback до того, як v3 зареєструється.

---

## IIFE Guards

| Guard | Файл | Рядок |
|---|---|---|
| `window.__SM_LIBRARY_V1_CLEAN_SPLIT__` | `library-pro.js` | 3 |
| `window.__SM_PLAN_VIEWER_V3__` | `plan-viewer-v3.js` | 3 |

Захищають від подвійного виконання при Webflow page transitions або multiple embed.

---

## window.* конфігурація (index.html)

Встановлюються у `<script>` блоці в `<head>` до завантаження будь-якого JS:

| Змінна | Значення за замовчуванням | Призначення |
|---|---|---|
| `SM_API_BASE` | `https://skymotion.onrender.com` | Backend URL |
| `SM_LIBRARY_DATA_URL` | `./library-data-pro.json` | URL локального JSON |
| `SM_CHECKLIST_PAPER_ASSET_URL` | CDN URL | Фонове зображення чеклісту |
| `SM_PRO_PACK_TITLE` | `"Test Pack"` | Назва пакету |
| `SM_PRO_PACK_CREATOR` | `"Creator Name"` | Автор пакету |
| `SM_PRO_PACK_DESCRIPTION` | (текст) | Опис пакету |
| `SM_REAL_ESTATE_PACK_COVER_URL` | (закоментовано) | Cover-зображення |
| `SM_PRO_BETA_PACK_ID` | (не задано) | ID beta pack (fallback: `"real_estate_creator_pack"`) |

---

## Custom Event шина (міжмодульна комунікація)

Єдиний спосіб зв'язку між `library-pro.js` і `plan-viewer-v3.js`.

| Подія | Хто диспатчить | Хто слухає | Payload |
|---|---|---|---|
| `sm:open-plan` | library-pro.js (клік по plan card) | plan-viewer-v3.js | `{ plan, allItems }` |
| `sm:reopen-plan-after-player` | library-pro.js (closeModal) | plan-viewer-v3.js | — |
| `sm:open-move-player` | plan-viewer-v3.js (play button) | library-pro.js | `{ move }` |
| `sm:plan_opened` | library-pro.js | аналітика | `{ item_id, item_type, title }` |
| `sm:plan_closed` | plan-viewer-v3.js | аналітика | `{ item_id, last_slide_index }` |
| `sm:plan_slide_changed` | plan-viewer-v3.js | аналітика | `{ slide_index, slide_type }` |
| `sm:plan_result_video_started` | plan-viewer-v3.js | аналітика | `{ item_id, title }` |
| `sm:plan_step_video_opened` | plan-viewer-v3.js | аналітика | `{ move_ref, slide_index }` |
| `sm:save_clicked` | library-pro.js | аналітика | `{ item_id, action, item_type }` |
| `sm:tag_clicked` | library-pro.js | аналітика | `{ step_key, tag_name }` |
| `sm:library_viewed` | library-pro.js | аналітика | `{ results_count }` |

**Не перейменовувати перші три** — ламають Plan Viewer bridge.

---

## Потік даних

```
CDN JSON (videos_index_v16.json)
  → loadItems() у library-pro.js
  → allItems[] (moves + plans, plans-first)
  → getFilteredItems(state) → filtered[]
  → renderResults() → DOM картки

library-data-pro.json
  → window.SM_LIBRARY_DATA_URL (читається як конфіг)
  → getProPackItems() — hardcoded всередині library-pro.js (не з JSON!)
  ⚠ JSON не використовується напряму runtime-ом — лише reference

Backend API (Render)
  → /v1/me/access → accessCache {isPro, ownedPacks}
  → /v1/saved-moves → savedCache[]
  → /v1/saved-items → savedItemKeys Set
```
