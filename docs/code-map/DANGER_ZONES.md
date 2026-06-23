# DANGER ZONES — SkyMotion Pro Library

Місця, які не можна змінювати без ручного тесту. Кожна зона помічена рівнем ризику.

---

## 🔴 Зона 1 — Memberstack Auth

**Файл:** `library-pro.js`, рядки ~263–324
**Функції:** `getMember(timeout)`, `api(path, opts)`

### Що не чіпати
- Polling loop (250ms `sleep`, до `timeout: 12000ms`)
- Кеш 15 секунд (`_memberCache`, `_memberCacheAt`)
- `window.$memberstackDom || window.$memberstack` — порядок пошуку
- `LOGIN_REQUIRED` throw зі `status: 401` — інші частини коду покладаються на це

### Чому небезпечно
- Весь backend залежить від `api()`: saved moves, access check, будь-який POST/DELETE
- Memberstack завантажується асинхронно; polling loop — єдиний спосіб дочекатись
- Зміна порядку `$memberstackDom || $memberstack` може зламати auth у специфічних Webflow embedах

### x-ms-id header
```js
headers.set("x-ms-id", member.id)
```
FastAPI backend **вимагає** цей заголовок. Без нього — 401/403. Не перейменовувати, не робити опціональним.

### Тест після будь-якої зміни
- Збережений хід зберігається (POST `/v1/saved-moves`)
- Saved tab показує правильні ходи
- Pack detail locked/unlocked правильно (залежить від `/v1/me/access`)

---

## 🔴 Зона 2 — Saved Moves System

**Файл:** `library-pro.js`, рядки ~326–598
**Ключові змінні:** `savedCache[]`, `savedItemKeys` (Set)
**localStorage ключі:** `"sm_pro_saved_moves_v1"`, `"sm_pro_saved_items_v1"`

### Що не чіпати
- `normalizeSavedMoveRecord(x)` — схема об'єкта ходу (зміна ламає десеріалізацію з localStorage)
- `loadLocalSavedState()` — merge-логіка local + backend (Map by id)
- `persistLocalSavedState()` — викликається після **кожної** зміни
- `syncSavedMoveToBackend()` — **fire-and-forget**; робити блокуючим = UX regression (save button freezes)
- `PRO_BETA_PACK_ID` — `window.SM_PRO_BETA_PACK_ID || "real_estate_creator_pack"`; зміна → зміна pack access логіки

### Чому небезпечно
- Зміна ключів localStorage знищить збережені ходи у users без backend-акаунта
- Зміна структури `normalizeSavedMoveRecord` без міграції → JSON.parse success, але поля undefined
- `savedItemKeys` Set і `savedCache` Array мають бути синхронізовані через `syncMoveKeysFromSavedCache()`; розсинхронізація → UI показує неправильний стан

### Тест після будь-якої зміни
- Save move → localStorage оновлюється → reload → move досі збережений
- Unsave → localStorage оновлюється → reload → move не збережений
- Збереження pack → Pack Detail badge показує "Saved"
- Saved tab → правильна кількість ходів

---

## 🔴 Зона 3 — Scroll Lock System

**Файл:** `library-pro.js`, рядки ~16–69 (setPackDetailPageMode) та ~600–622 (applyOverflow)

### Три незалежних системи
```
System 1: applyOverflow() — library-pro.js рядки 600–622
  → перевіряє locks.drawer, locks.modal, packDetailOpen
  → пише overflow:hidden !important через setProperty

System 2: setPackDetailPageMode(enabled) — library-pro.js рядки 16–69
  → найагресивніша: !important на html, body, scope, .library, .results, .results__grid
  → повинна викликатись парно: true при відкритті, false при закритті

System 3: setBodyLock(locked) — plan-viewer-v3.js рядки 73–76
  → пише document.documentElement/body.style.overflow напряму
  → БЕЗ !important → може бути перекрита System 1
  → не знає про locks об'єкт
```

### Що не чіпати
- Порядок викликів у `setProTab()`: завжди `setPackDetailPageMode(false)` перед re-render
- `locks.drawer = true/false` у `openAssistant()` / `closeAssistant()`
- `locks.modal = true/false` у `setModal()`
- `clearCleanup()` у `plan-viewer-v3.js` — знімає всі event listeners при закритті

### Чому небезпечно
- Неправильний порядок → сторінка заморожена (overflow:hidden залишається)
- System 2 пише `!important` на `<html>` і `<body>` — перекриває будь-що
- System 3 у plan-viewer-v3.js при `setBodyLock(false)` знімає overflow без `!important` → якщо System 1 раніше поставила `!important`, сторінка залишиться locked

### Тест після будь-якої зміни
- Відкрити Drawer → Закрити: скрол відновлений ✓
- Відкрити Move Player → Закрити: скрол відновлений ✓
- Відкрити Pack Detail → Закрити: скрол відновлений ✓
- Відкрити Plan Viewer → Закрити: скрол відновлений ✓
- Pack Detail → Plan Viewer → Закрити Plan Viewer: Pack Detail scrollable ✓
- Filter Drawer → відкрити → повернутись: бібліотека scrollable ✓

---

## 🔴 Зона 4 — Custom Event Bridge

**Файли:** `library-pro.js` (dispatch + listen), `plan-viewer-v3.js` (dispatch + listen)

### Критичні event names — не перейменовувати
| Event | Хто диспатчить | Хто слухає |
|---|---|---|
| `sm:open-plan` | library-pro.js | plan-viewer-v3.js |
| `sm:reopen-plan-after-player` | library-pro.js (closeModal) | plan-viewer-v3.js |
| `sm:open-move-player` | plan-viewer-v3.js | library-pro.js |

### Небезпечний стан: returnToPlanAfterClose + suspendedPlanState

```js
// library-pro.js
let returnToPlanAfterClose = false   // встановлюється перед відкриттям move player з плану

// plan-viewer-v3.js
let suspendedPlanState = null        // { plan, allItems, activeSlide }
```

Якщо один з цих не скинутий при закритті:
- `returnToPlanAfterClose = true` + Plan Viewer вже закритий → dispatch `sm:reopen-plan-after-player` → нічого не відбувається (listener читає null `suspendedPlanState`)
- `suspendedPlanState` не null при подвійному відкритті → overwrite → втрата попереднього слайду

### Тест після будь-якої зміни
- Plan card → Plan Viewer → Step slide → Play → Move Player → Close: Plan Viewer відновлюється на тому ж слайді
- Подвійний клік по play в різних планах: тільки один Plan Viewer відкритий

---

## 🟠 Зона 5 — ensureBasicPlanViewer()

**Файл:** `library-pro.js`, рядки ~4028–4095

### Що не чіпати
- Саму функцію — не видаляти
- Виклик `ensureBasicPlanViewer()` на рядку ~4095 — повинен бути **до** `loadItems()`
- Перевірку `if (window.SMPlanViewerV3 && ...) return` — саме вона пропускає fallback коли v3 доступний

### Чому небезпечно
- Якщо `plan-viewer-v3.js` не завантажений (Webflow config), fallback — єдиний спосіб відкрити плани
- Якщо виклик переміщений після `loadItems()` → v3 вже ініціалізований → fallback ніколи не встановлюється → потенційно OK, але race condition

### Тест
- Відкрити сторінку без `plan-viewer-v3.js` → клік по plan card → повинен відкритись basic viewer (не crash)

---

## 🟠 Зона 6 — hydrateAccessCache() та ownedPacks chain

**Файл:** `library-pro.js`, рядки ~421–438 та ~4167–4179

### Порядок hydration — не змінювати
```js
await hydrateAccessCache()      // → accessCache {isPro, ownedPacks}
await hydrateSavedCache()       // → savedCache[] (потребує accessCache для PRO_BETA_PACK_ID)
await hydrateSavedItemsCache()  // → savedItemKeys Set
applyFilters()                  // → renderResults()
```

### PRO_BETA_PACK_ID логіка
```js
if (accessCache.isPro && PRO_BETA_PACK_ID && !accessCache.ownedPacks.includes(PRO_BETA_PACK_ID)) {
  accessCache.ownedPacks.push(PRO_BETA_PACK_ID)  // auto-grant pro beta pack
}
```
Якщо `/v1/me/access` не повертає pack — він auto-granted для Pro users. Зміна цієї логіки → зміна pack access без backend.

### Тест
- Pro user: Pack Detail доступний
- Non-pro user: Pack Detail показує locked стан (якщо є)

---

## 🟠 Зона 7 — setupPlayerAutoHideUI IIFE

**Файл:** `library-pro.js`, рядки ~4182–4256

### Що не чіпати
- Структуру IIFE — не обгортати в інший scope
- `MutationObserver` на `#modal` `aria-hidden` — слухає зміни при відкритті/закритті
- 2800ms таймер автоприховування controls

### Чому небезпечно
- Якщо `#modal` DOM element змінюється (id, структура) → MutationObserver не підключиться
- Якщо цей блок перемістити вище `const modal = $(...)` → `modal` буде undefined

---

## 🟡 Зона 8 — JS-Generated CSS Classes

Ці класи додаються динамічно через JS. **Не можна називати їх "мертвими"** без пошуку в JS-коді.

| Клас | Функція у JS | Де використовується в CSS |
|---|---|---|
| `sm-pro-filter-screen` | `openAssistant()`, `renderMobileStepScreen()` | `#sm-library-scope .assistant.sm-pro-filter-screen` |
| `sm-pro-desktop-filter` | `renderDesktopStepScreen()` | `#sm-library-scope .assistant.sm-pro-desktop-filter` |
| `sm-pro-reject` | `showNoMatch()` | `.sm-pro-reject` animation |
| `sm-pro-subscreen` | `setProTab()` | `#sm-library-scope.sm-pro-subscreen` |
| `sm-pro-pack-detail-active` | pack detail render | `#sm-library-scope.sm-pro-pack-detail-active` |
| `sm-pack-detail-open` | `setPackDetailPageMode(true)` | `html.sm-pack-detail-open`, `body.sm-pack-detail-open` |
| `sm-pro-desktop-home-grid` | `renderProDesktopHome()` | `#resultsGrid.sm-pro-desktop-home-grid` |
| `is-attention` | `shakeFiltersButton()` | `.mobile-open.is-attention` |
| `isSaved` | `setMoveSaveUi()`, `renderMoveCard()` | `.sm-save.isSaved` |
| `is-active` | `setProTab()`, `buildDots()`, `renderMoveLevelTabs()` | `button.is-active`, `.spv3Dot.is-active` |
| `is-open` | `toggleProSearch()` | `.sm-pro-searchbar.is-open` |
| `is-shaking` | `showNoMatch()` | `.opt.is-shaking` |
| `is-visible` | `setRotateHintVisible()`, searchbar clear btn | `.sm-pro-searchbar__clear.is-visible` |
| `sm-pro-filter-screen--desktop` | needs manual verification | — |
| `sm-env-visual-mode` | `renderMobileStepScreen()` | `.chat.sm-env-visual-mode` |
| `isPlan` | `setModal()` у openPlayer | `#modal.isPlan` |
| `is-fs-ui-hidden` | `setFsUiHidden()` | `#modal.is-fs-ui-hidden` |
| `smFiltersOpen` | `openAssistant()` | `#sm-library-scope.smFiltersOpen` |

---

## Правило "двох перевірок" перед видаленням CSS

Перед видаленням будь-якого CSS-правила або класу:

1. **Grep у JS:** `grep -r "className" library-pro.js plan-viewer-v3.js` — чи не додається через JS?
2. **Grep у HTML:** `grep -r "className" index.html` — чи не в базовому DOM?
3. Якщо знайдено — **не видаляти**.
4. Якщо не знайдено — позначити як "needs manual verification in Webflow" перед видаленням.
