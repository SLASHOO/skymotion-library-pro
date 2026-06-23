# PLAN VIEWER MAP — Plan Viewer v3

## Відповідальні файли

| Файл | Роль |
|---|---|
| `plan-viewer-v3.js` | Вся логіка Plan Viewer (окремий IIFE) |
| `plan-viewer-v3.css` | Стилі Plan Viewer (standalone) |
| `library-pro.css` рядки ~5836–6207 | **Дублікат** стилів Plan Viewer (вбудований) |
| `library-pro.js` рядки ~3991–4095 | Plan Viewer bridge + fallback |
| `index.html` рядки 102–113 | DOM-скелет Plan Viewer (`#sm-plan-v3-root` + дочірні елементи) |

---

## DOM-структура

Повинна існувати в HTML **до завантаження** `plan-viewer-v3.js`:

```html
<div id="sm-plan-v3-root">
  <div class="spv3" id="spv3Modal" aria-hidden="true" role="dialog" aria-modal="true">
    <div class="spv3__backdrop" id="spv3Backdrop"></div>
    <div class="spv3__dialog">
      <button class="spv3__close" id="spv3Close" type="button" aria-label="Close">✕</button>
      <div class="spv3__viewport" id="spv3Viewport">
        <div class="spv3__track" id="spv3Track"></div>
      </div>
      <div class="spv3__dots" id="spv3Dots"></div>
    </div>
  </div>
</div>
```

Якщо будь-який з `#spv3Modal`, `#spv3Backdrop`, `#spv3Close`, `#spv3Viewport`, `#spv3Track`, `#spv3Dots` відсутній — `plan-viewer-v3.js` виходить на рядку 16:
```js
if (!modal || !backdrop || !closeBtn || !viewport || !track || !dots) return;
```
І `window.SMPlanViewerV3` **не встановлюється** → `ensureBasicPlanViewer()` у `library-pro.js` створить fallback.

---

## Стан модуля (plan-viewer-v3.js)

```js
let currentPlan = null           // поточний план
let currentAllItems = []         // всі items для resolve move refs
let suspendedPlanState = null    // стан при переході до відеоплеєра
let activeSlide = 0              // поточний слайд (0 = result video)
let totalSlides = 0              // 1 + кількість steps
let cleanupFns = []              // масив функцій для cleanup event listeners
let navLocked = false            // 260ms lock після навігації
```

---

## Slide архітектура

```
Slide 0: buildResultSlide(plan)
  → <video id="spv3ResultVideo"> autoplay, loop, unmuted
  → <div class="spv3Result__overlay"> title

Slide 1..N: buildStepSlide(plan, allItems, stepIndex)
  → <img.spv3Step__poster> (72% висоти)
  → <button.spv3PlayBtn data-move-ref data-move-url> (відкриває move player)
  → <div.spv3Step__bottom> 28% висоти
     → buildTimeline(plan, stepIndex) — горизонтальний скрол timeline
```

---

## Custom Events — повний flow

```
LIBRARY → PLAN VIEWER:

1. Користувач клікає plan card
   library-pro.js dispatch:
     window.dispatchEvent(new CustomEvent("sm:open-plan", { detail: { plan, allItems } }))
   + Direct call (dev fallback):
     window.SMPlanViewerV3.open(item, allItems)

   plan-viewer-v3.js:
     window.addEventListener("sm:open-plan", e => openPlan(e.detail.plan, e.detail.allItems))


PLAN VIEWER → LIBRARY (watch move):

2. Користувач клікає Play на step slide
   plan-viewer-v3.js:
     suspendedPlanState = { plan, allItems, activeSlide }  // зберігаємо стан
     modal.setAttribute("aria-hidden", "true")             // ховаємо plan viewer
     setTimeout(() => {
       window.dispatchEvent(new CustomEvent("sm:open-move-player", { detail: { move } }))
     }, 20)

   library-pro.js:
     window.addEventListener("sm:open-move-player", e => openPlayer(...))


LIBRARY → PLAN VIEWER (відновлення після відео):

3. Користувач закриває move player
   library-pro.js closeModal():
     if (returnToPlanAfterClose) {
       window.dispatchEvent(new CustomEvent("sm:reopen-plan-after-player"))
     }

   plan-viewer-v3.js:
     window.addEventListener("sm:reopen-plan-after-player", () => {
       if (!suspendedPlanState?.plan) return
       const saved = suspendedPlanState
       suspendedPlanState = null
       openPlan(saved.plan, saved.allItems)
       if (saved.activeSlide > 0) {
         activeSlide = saved.activeSlide
         renderSlides()
       }
     })
```

---

## Медіа-логіка

### Result slide (slide 0)
- `spv3ResultVideo` — autoplay, loop, **unmuted**, `playsInline`
- `syncPlanMedia()` → `tryPlayResultVideo()` при switch на slide 0
- При переході з slide 0 → `hardStopVideo()` (pause + mute + currentTime=0)

### Step slides (slide 1+)
- Статичне poster зображення
- Кнопка Play → відкриває move player з `data-move-url` або `getMoveByRef()`

### Touch / Swipe navigation
- `touchstart/touchmove/touchend` на `#spv3Viewport`
- `touchmove` — `passive: false` → `e.preventDefault()` для горизонтального swipe
- `isInteractiveScrollArea(target)` — виключає `.spv3TimelineFlow__scroller` (горизонтальний скрол timeline)
- Поріг свайпу: `deltaX > 50 && deltaX > deltaY`

### Keyboard
- `Escape` → `closeModal()`
- `ArrowRight` → `goNext()`
- `ArrowLeft` → `goPrev()`

---

## Fallback: ensureBasicPlanViewer()

**Де:** `library-pro.js`, рядки ~4028–4093, викликається одразу на рядку ~4095.

**Спрацьовує коли:** `window.SMPlanViewerV3` відсутній або не є функцією.

**Що робить:**
```js
window.SMPlanViewerV3 = {
  open(plan) {
    const viewer = document.createElement("div")
    viewer.className = "sm-basic-plan-viewer"
    // простий HTML: cover + title + steps list
    document.body.appendChild(viewer)
    document.documentElement.style.overflow = "hidden"   // своя scroll-lock система!
    document.body.style.overflow = "hidden"
  }
}
```

**Відмінності від Plan Viewer v3:**
- Немає slide navigation
- Немає result video
- Немає timeline
- Немає swipe
- Проста list-view кроків
- `sm-basic-plan-viewer` — unscoped CSS клас
- Власна scroll-lock система (конфліктує з `applyOverflow()`)

**Не видаляти** — єдиний захист якщо `plan-viewer-v3.js` не завантажений.

---

## CSS-конфлікти між library-pro.css і plan-viewer-v3.css

Обидва файли описують `#sm-plan-v3-root` стилі. В index.html: `library-pro.css` завантажується **першим**, `plan-viewer-v3.css` — **другим**. При однаковій специфіці перемагає `plan-viewer-v3.css`.

| Селектор / Властивість | library-pro.css (~рядок) | plan-viewer-v3.css (~рядок) | Хто виграє |
|---|---|---|---|
| `.spv3` z-index | `100500` (~5839) | `100000` (~36) | **plan-viewer-v3.css** (100000) |
| `.spv3__close top` | `calc(14px + env(...))` (~5878) | `18px` (~72) | **plan-viewer-v3.css** (18px) |
| `.spv3__close right` | `14px` (~5879) | `22px` (~73) | **plan-viewer-v3.css** (22px) |
| `.spv3__dialog background` | `#050607` | складний градієнт | **plan-viewer-v3.css** |
| `.spv3__backdrop` | фіолетово-чорний | простіший | **plan-viewer-v3.css** |
| `transition label font-size` (640px) | needs verification | `9px` (~690) | **plan-viewer-v3.css** (9px) ← виправлено |

**Другий блок plan-viewer-v3.css (рядки 881–930):**
```css
#sm-plan-v3-root {
  position: static !important;
  width: 0 !important;
  height: 0 !important;
  /* ... */
}
```
Це Webflow-embed workaround: `#sm-plan-v3-root` не займає місця у потоці. При відкритому modal `.spv3[aria-hidden="false"]` override перевизначає на `position:fixed`. Конфліктує з початком власного файлу де position не задано. Якщо видаляти — перевірити що `#sm-plan-v3-root` у Webflow не займає місця у layout.

---

## Завантаження в dev vs Webflow

| Середовище | Де DOM | Де JS | Де CSS |
|---|---|---|---|
| Dev (index.html) | рядки 102–113 index.html | `<script src="./plan-viewer-v3.js">` рядок 115 | `<link plan-viewer-v3.css>` рядок 22 |
| Webflow production | Custom HTML embed на сторінці | Custom code → зовнішній JS файл | Custom code → зовнішній CSS файл або `library-pro.css` вбудований блок |
