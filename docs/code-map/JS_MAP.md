# JS MAP — library-pro.js + plan-viewer-v3.js

## library-pro.js (~4257 рядків)

Один великий IIFE з guard `window.__SM_LIBRARY_V1_CLEAN_SPLIT__`.

---

### Блок 1 — Ініціалізація та константи (рядки ~1–99)

```js
window.__SM_LIBRARY_V1_CLEAN_SPLIT__ = true   // guard
const FALLBACK_THUMB = "..."                    // CDN fallback image
const CDN_INDEX_URL = "...videos_index_v16.json"
const API_BASE = window.SM_API_BASE || "https://skymotion.onrender.com"
const $ = (id) => document.getElementById(id)
```

DOM-refs (рядки ~70–98):
- `scope` = `#sm-library-scope`
- `openAssistantBtn`, `closeAssistantBtn`, `assistantBackdropEl`, `assistant`
- `chat`, `grid` (`#resultsGrid`), `matchCount`, `resetBtn`, `backBtn`
- `showResultsBtn`, `filterProgressBar`, `backToResultsBtn`, `moreBtn`
- `modal`, `modalBackdrop`, `modalContent`, `resultsHead`

`required` — перевірка наявності обов'язкових елементів (якщо щось відсутнє — IIFE exits).

`setPackDetailPageMode(enabled)` — рядки 16–69: **найагресивніша DOM-маніпуляція у файлі**; пише `!important` inline styles на `html`, `body`, `scope`, `.library`, `.results`, `.results__grid`. Детальніше у DANGER_ZONES.md.

---

### Блок 2 — Утиліти (рядки ~107–258)

| Функція | Призначення |
|---|---|
| `sleep(ms)` | Promise timeout |
| `setPlayerViewportHeight()` | Встановлює `--sm-player-vh` з `window.innerHeight` |
| `escapeHtml(str)` | XSS-захист для DOM |
| `formatPlayerTime(sec)` | `M:SS` формат |
| `safeText(el, t)` | Безпечна заміна `textContent` |
| `isPlan(x)` | Перевіряє `x.kind === "plan"` |
| `normalizeUrl(u)` | Trim + empty fallback |
| `pickThumb(...candidates)` | Перший непорожній URL |
| `formatSeconds(sec)` | `M:SS` або `0:SS` |
| `attachImgFallback(root)` | `onerror` → `FALLBACK_THUMB` на всіх img |
| `getVideoId(v)` | `id || slug || videoUrl || title+duration` |
| `hasMatch(itemValue, selectedValue)` | Фільтр-матч по масиву |
| `normalizeFilterValue(stepKey, label)` | Велика map-таблиця: label → data key |
| `shakeFiltersButton()` | CSS shake анімація на `openAssistantBtn` |

Listeners на `window.resize` і `orientationchange` → `setPlayerViewportHeight()`.

---

### Блок 3 — Memberstack Auth (рядки ~263–324)
**⚠ DANGER ZONE — не змінювати**

```js
let _memberCache = null
let _memberCacheAt = 0

async function getMember(timeout = 12000)
async function api(path, opts = {})
```

`getMember()`:
- Polling loop кожні 250ms до `timeout` (12сек)
- Кеш 15 секунд (`_memberCacheAt`)
- Пробує `window.$memberstackDom || window.$memberstack`
- Повертає member або `null`

`api()`:
- Блокує поки не отримає `member.id`
- Кидає `Error("LOGIN_REQUIRED")` зі `status: 401` якщо немає member
- Автоматично додає `x-ms-id: member.id` до headers
- Обробляє JSON/text відповіді

---

### Блок 4 — Saved State System (рядки ~326–598)
**⚠ DANGER ZONE — не змінювати**

```js
let savedCache = []          // масив об'єктів збережених ходів
let savedItemKeys = new Set() // "move:id" / "pack:id" ключі
let accessCache = { isPro: false, ownedPacks: [] }
const PRO_BETA_PACK_ID = window.SM_PRO_BETA_PACK_ID || "real_estate_creator_pack"
const LOCAL_SAVED_MOVES_KEY = "sm_pro_saved_moves_v1"
const LOCAL_SAVED_ITEMS_KEY = "sm_pro_saved_items_v1"
```

Утиліти стану:
- `normalizeSavedMoveRecord(x)` — нормалізує об'єкт ходу
- `readLocalJson(key, fallback)` — безпечне `localStorage.getItem` + `JSON.parse`
- `loadLocalSavedState()` — merge localStorage → `savedCache` при старті
- `persistLocalSavedState()` — `localStorage.setItem` після кожної зміни
- `getSavedKey(type, id)` — `"move:id"` або `"pack:id"`
- `isSaved(id)` / `isGenericSaved(type, id)` — перевірка стану
- `addSavedKey/removeSavedKey` — мутатори Set
- `syncMoveKeysFromSavedCache()` — синхронізує Set з масивом

API-гідрація (викликається у `loadItems()`):
- `hydrateAccessCache()` → `GET /v1/me/access` → `accessCache`
- `hydrateSavedCache()` → `GET /v1/saved-moves` → `savedCache`
- `hydrateSavedItemsCache()` → `GET /v1/saved-items` → `savedItemKeys`

Мутатори:
- `toggleSaved(video)` — оновлює `savedCache` і `savedItemKeys` локально, потім `syncSavedMoveToBackend()`
- `toggleSavedPack(pack)` — те саме для пакунків
- `syncSavedMoveToBackend(action, id, payload)` — **fire-and-forget** POST/DELETE до backend

---

### Блок 5 — Scroll Locks та Drawer (рядки ~600–870)
**⚠ DANGER ZONE — не змінювати без ручного тесту**

```js
const locks = { drawer: false, modal: false }
```

Функції:
- `applyOverflow()` — master overflow controller; перевіряє `locks.drawer`, `locks.modal`, `packDetailOpen`; пише/знімає `overflow: hidden !important` на `html` і `body`
- `isDrawerMode()` → `max-width: 900px`
- `isPortraitViewport()` → `orientation: portrait`
- `openAssistant()` / `closeAssistant()` — toggle drawer + `locks.drawer`
- `goToResults()` — `closeAssistant()` + scroll до `.results`
- `setModal(open)` — toggle `aria-hidden` + `locks.modal`
- `closeModal()` — cleanup player, `locks.modal = false`, dispatch `sm:reopen-plan-after-player` якщо потрібно
- `returnToPlanAfterClose` — flag для повернення до плану після закриття відеоплеєра

Video player (рядки ~710–870):
- `setFsUiHidden(hidden)` — клас `is-fs-ui-hidden` на `#modal`
- `enterPlayerFullscreen(player)` / `exitPlayerFullscreen()`
- `bindFullscreenState(player)` — слухає `fullscreenchange`, `webkitfullscreenchange`
- `isMobilePlayerUi()` → `max-width: 900px`
- `shouldShowRotateHint()` / `bindRotateHint()` / `setRotateHintVisible()`
- `togglePlayerPlayback(player, playPauseBtn)`

---

### Блок 6 — Filter Engine (рядки ~875–1600)

```js
let isBusy = false
const history = []     // стек для кнопки "Previous"
const steps = [...]    // 7 кроків: env, subject, space, risk, time, resultType, mood
const state = {}       // поточні вибрані значення
let stepIndex = 0
```

Chat/UI:
- `setBusy(v)` — блокує кнопки під час анімації
- `scrollChatBottom()` — автоскрол чату
- `addBotRow()` / `addUserRow(text)` — DOM-рядки чату
- `addBotTyped(text)` — typing animation

Фільтрація:
- `getFilterSelected(nextState)` — нормалізує state через `normalizeFilterValue()`
- `getStrictFilteredItems(nextState)` — фільтрує `allItems` по `env`, `risk`, `subject`, `mood`
- `getFilteredItems(nextState)` — wrapper (space/time/resultType — заглушки для майбутнього)

Filter UI:
- `updateFilterUi()` — оновлює прогрес-бар, matchCount, "Show N" кнопки
- `isProMobilePortrait()` → `(max-width:900px) and (orientation:portrait)`
- `isProDesktopLayout()` → `(min-width:901px) and NOT (max-height:560px and landscape)`
- `ensureMobileShowButton()` — створює і кешує кнопку у `.assistant__footerRow`
- `ensureFilterHero()` — DOM inject `.sm-pro-filter-hero` перед `.chat`
- `updateFilterHero()` — оновлює сегменти прогресу
- `getEnvArtClass(label)` — label → CSS art-клас для картки середовища
- `getEnvThumb(label)` — найкращий thumb з `allItems` для env карточки (scoring algorithm)
- `handleFilterOptionClick(btn, label, s)` — обробка кліку по опції фільтру

Render modes:
- `renderOptions()` — dispatcher: mobile portrait → `renderMobileStepScreen()`, desktop → `renderDesktopStepScreen()`, legacy chat mode
- `renderMobileStepScreen()` — повноекранний step mode з env grid або pill grid
- `renderDesktopStepScreen()` — десктопна версія step mode

---

### Блок 7 — Render Primitives (рядки ~1600–1730)

- `bookmarkSvg()` — SVG bookmark для save button
- `normalizeDifficulty(value)` / `getMoveDifficulty(v)` / `difficultyTone(level)` — рівень складності
- `renderMoveCard(v, i)` — `div.card` з thumbnail, save button, title, badge, difficulty pill; `data-index`, `data-kind="move"`, `data-item-id`
- `renderPlanCard(p, i)` — `div.cardPlan` з `.planMedia`, `.planPills`, `.planCaption`, `.planBubble`; `data-index`, `data-kind="plan"`, `data-item-id`

---

### Блок 8 — Відновлені Utility-функції (рядки ~1730–1950)

Ці функції існували лише в першому (v8) блоці і були відновлені після cleanup.

| Функція | Призначення |
|---|---|
| `setupProTabs()` | Прив'язує click listeners до `.sm-pro-mobile-tabs button` |
| `switchProTabFromButton(e)` | Обробляє кліки `[data-pro-go-tab]` |
| `renderSectionHeader(title, viewLabel, tab)` | HTML-рядок заголовку секції |
| `getMoveMetaText(v)` | difficulty + mood/risk рядок |
| `getMoveDescription(v)` | description або fallback по title |
| `getTagLabel(arr, fallback)` | Перший елемент масиву → Caption Case |
| `getMoveStyleLabel(v)` | mood || risk → стиль |
| `getMoveSpaceLabel(v)` | env array → space label |
| `getMoveSubjectLabel(v)` | subject array → label |
| `normalizeSearchText(value)` | lowercase + NFD normalize |
| `getMoveSearchTitle(item)` | search тільки по title |
| `getMovesForSearch(moves)` | фільтр по `proSearchQuery` |
| `toggleProSearch(open)` | toggle пошуку |
| `renderMoveListCard(v, i)` | `article.sm-pro-move-row` list-view рядок |
| `getMovesForActiveLevel(moves)` | фільтр по `activeMoveLevel` |
| `renderMoveLevelTabs(wrap, moves)` | рендерить рівні (All/Basic/Intermediate/Advanced/Saved) |
| `getProMovesData()` | `{ allMoves, levelMoves, moves }` |
| `getProMovesCountLabel(moves, levelMoves)` | рядок лічильника |

---

### Блок 9 — PRO SUBSCREENS v9 (рядки ~1952–3423)

Позначений коментарем `/* PRO SUBSCREENS v9 */`.

Вкладки:
- `setProTab(tab)` — `all|moves|plans|packs|saved`; скидає `activeProPackId`, `proSearchQuery`, `setPackDetailPageMode(false)`, ре-рендерить
- `setupProTabs()` (є і у Блоці 8) — needs manual verification якщо є дублювання після відновлення

Scaffold:
- `renderProToolHeader(title, options)` — tool header з back `[data-pro-go-tab="all"]` і search/filter іконкою
- `renderProScreenShell(title)` — очищує `grid`, ховає `resultsHead`/`moreBtn`, повертає `wrap`
- `renderProSearchBar(wrap)` — пошуковий input + `updateProActiveLive()`
- `renderProCountRow(wrap, label, ariaLabel)` — рядок з лічильником + search-toggle
- `setProCount(wrap, label)` — оновлює `[data-pro-content-count]`
- `renderProEmpty(wrap, title, text)` — empty state

Subscreens:
- `renderProMovesScreen()` / `updateProMovesLive()` — moves з рівнями + list view
- `renderProPlansScreen()` / `updateProPlansLive()` — plans poster grid
- `renderProPacksScreen()` / `updateProPacksLive()` — packs rows
- `renderProSavedScreen()` / `updateProSavedLive()` — saved moves list
- `updateProActiveLive()` — dispatcher між live-update функціями

Home screens:
- `renderProMobileHome()` — mobile portrait home (Featured Pack + Popular Moves + Plans sections)
- `renderProDesktopHome()` — desktop home (двоколонний layout)
- `renderFeaturedPackCard()` — велика карточка пакету на home

Main dispatcher:
- `renderResults()` (рядки ~3150–3423) — вибирає що рендерити: mobile home / desktop home / subscreen залежно від `isProMobilePortrait()`, `isProDesktopLayout()`, `activeProTab`, `activeProPackId`

```
applyFilters() → filtered[] → renderResults()
     ↓
  isProMobilePortrait?
    ├─ activeProPackId → renderProPackDetailScreen()
    ├─ activeProTab=="moves" → renderProMovesScreen()
    ├─ activeProTab=="plans" → renderProPlansScreen()
    ├─ activeProTab=="packs" → renderProPacksScreen()
    ├─ activeProTab=="saved" → renderProSavedScreen()
    └─ activeProTab=="all" → renderProMobileHome()
  isProDesktopLayout?
    ├─ activeProPackId → renderProPackDetailScreen()
    ├─ activeProTab !== "all" → відповідний subscreen
    └─ activeProTab=="all" → renderProDesktopHome()
  else (landscape phone) → legacy free-library grid
```

---

### Блок 10 — Pack Detail (рядки ~3425–3800)

- `getProPackItems()` — масив hardcoded pack-об'єктів (checklist, lessons, moveIds, planIds)
- `getPackCommercialInfo(pack)` — комерційний опис пакету
- `renderProPackDetailScreen()` — dispatch між desktop/mobile версіями
- `renderProPackDetailScreenDesktopV125()` — desktop pack detail (cover + lessons + moves + plans)
- `renderProPackDetailScreenMobileV25()` — mobile pack detail

Checklist:
- `openProChecklist(packId)` / `closeProChecklist()` — toggle checklist sheet
- `renderChecklistSheet(pack)` — HTML чеклісту з checkbox items

---

### Блок 11 — Click Handlers (рядки ~3800–4015)

Один великий `grid.addEventListener("click", async (e) => {...})` обробляє:
1. `[data-pro-go-tab]` → `switchProTabFromButton(e)`
2. `[data-pro-toggle-search]` → `toggleProSearch()`
3. `[data-open-pro-filters]` → `openAssistant()`
4. `[data-pro-pack-save]` → `toggleSavedPack()`
5. `.sm-save` (direct save btn) → `toggleSaved()`
6. `[data-pro-pack]` → `activeProPackId = ...`, `renderResults()`
7. `.card, .cardPlan, .sm-pro-move-row, .sm-pro-pack-move-card, .sm-pro-pack-plan-card` → `getLibraryItemFromCard()`:
   - якщо `isPlan(item)` → dispatch `sm:open-plan` + `SMPlanViewerV3.open()`
   - інакше → `openPlayer(idx)`

`document.addEventListener("click")` — закриття checklist (`[data-pro-close-checklist]`)

`window.addEventListener("keydown")` — `Escape` → `closeProChecklist()`

---

### Блок 12 — Plan Viewer Bridge (рядки ~3991–4015)
**⚠ DANGER ZONE**

```js
if (isPlan(item)) {
  emit("sm:plan_opened", {...})
  window.dispatchEvent(new CustomEvent("sm:open-plan", { detail: { plan: item, allItems } }))

  // Direct fallback для dev/local де CustomEvent listener не зареєстрований
  if (window.SMPlanViewerV3 && typeof window.SMPlanViewerV3.open === "function") {
    window.SMPlanViewerV3.open(item, allItems)
  }
}
```

`window.addEventListener("sm:reopen-plan-after-player")` (рядки ~4145–4155):
- Якщо `returnToPlanAfterClose === true` (встановлюється у `closeModal()`)
- Dispatch → `plan-viewer-v3.js` слухає і відновлює `suspendedPlanState`

---

### Блок 13 — Fallback Plan Viewer (рядки ~4020–4095)

```js
function ensureBasicPlanViewer() {
  if (window.SMPlanViewerV3 && ...) return  // v3 вже є — не потрібен
  window.SMPlanViewerV3 = {
    open(plan) { /* basic viewer */ }
  }
}
ensureBasicPlanViewer()  // викликається одразу
```

Fallback appends `div.sm-basic-plan-viewer` до `document.body`. Має **власну** scroll-lock логіку (третя незалежна система!). Детальніше у DANGER_ZONES.md.

---

### Блок 14 — Data Loading (рядки ~4097–4180)

```js
async function loadItems() {
  isInitialLoading = true
  showSkeletons(8)
  const res = await fetch(CDN_INDEX_URL, { cache: "no-store" })
  // ...
  allItems = [...plans, ...moves]  // plans-first order
  isInitialLoading = false
  await hydrateAccessCache()
  await hydrateSavedCache()
  await hydrateSavedItemsCache()
  applyFilters()
}
loadItems()
```

**Порядок hydration важливий:** `hydrateAccessCache` → `hydrateSavedCache` → `hydrateSavedItemsCache` → `applyFilters()`.

---

### Блок 15 — setupPlayerAutoHideUI IIFE (рядки ~4182–4256)
**⚠ DANGER ZONE — окремий IIFE**

Не є частиною головного IIFE. Спостерігає за `#modal` через `MutationObserver` (attr `aria-hidden`). При відкритому modal: слухає `mousemove` + `touchstart`, показує/ховає `.sm-modal__controls` з таймером 2800ms.

---

## plan-viewer-v3.js (~983 рядки)

Окремий IIFE з guard `window.__SM_PLAN_VIEWER_V3__`.

### Блоки

| Блок | Рядки | Що робить |
|---|---|---|
| Ініціалізація | 1–16 | Guard, DOM refs, exit якщо елементи відсутні |
| Утиліти | 17–110 | `escapeHtml`, `normalizeUrl`, `firstFilled`, `toNumberSafe`, `pickThumb`, `setBodyLock`, `clearCleanup` |
| Move resolution | 101–177 | `getMoveId`, `getMoveByRef`, `getStepMoveRef`, `getPlanCover`, `getPlanFinalVideo`, `getStepPoster`, `getStepMoveUrl` |
| Step data | 178–401 | `normalizeTransitionName`, `getTransitionBadgeLabel`, `normalizeShotName`, `getStepDuration`, `getStepTransition`, `getStepShortName`, `getStepTitle`, `getStepTip`, `getStepNote`, `findEditShotForStep` |
| Modal state | 402–430 | `setOpen(isOpen)`, `closeModal()` |
| Navigation | 431–515 | `buildDots()`, `bindDotsOnly()`, `syncPlanMedia()`, `renderSlides()`, `lockNavTemporarily()`, `goTo()`, `goNext()`, `goPrev()` |
| Timeline | 516–614 | `getTimelineShots()`, `buildTimeline()` (HTML timeline з clip/cut blocks) |
| Slide builders | 615–720 | `buildResultSlide(plan)`, `buildStepSlide(plan, allItems, stepIndex)` |
| Slides system | 712–843 | `buildSlides()`, `openMoveFromButton()`, `isInteractiveScrollArea()`, `tryPlayResultVideo()`, `bindSlideEvents()` |
| openPlan | 844–954 | DOM append, state reset, `buildSlides()`, `setOpen(true)`, touch events (swipe) |
| Event listeners | 956–977 | `sm:open-plan` → `openPlan()`; `sm:reopen-plan-after-player` → відновлення з `suspendedPlanState` |
| Public API | 979–982 | `window.SMPlanViewerV3 = { open: openPlan, close: closeModal }` |
