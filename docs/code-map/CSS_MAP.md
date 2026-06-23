# CSS MAP — library-pro.css + plan-viewer-v3.css

## Огляд

| Файл | Розмір | Scoping |
|---|---|---|
| `library-pro.css` | ~16000+ рядків | `#sm-library-scope` (окрім рядків 0–15 і деяких end-блоків) |
| `plan-viewer-v3.css` | ~930 рядків | `#sm-plan-v3-root` |

**Увага:** `library-pro.css` також містить вбудований блок `#sm-plan-v3-root` (~рядки 5836–6207), що дублює `plan-viewer-v3.css`. Це відомий CSS-конфлікт.

---

## library-pro.css — Секції

### Секція 1 — Глобальні unscoped правила (рядки ~0–15)
**⚠ Ризик витоку у Webflow**

```css
* { box-sizing: border-box }
html, body { margin: 0; min-height: 100%; background: #121212 }
body { color: rgba(255,255,255,.92); font-family: ...; -webkit-font-smoothing: antialiased }
```

Ці правила **не обгорнуті** в `#sm-library-scope`. Застосовуються до всієї Webflow-сторінки. Можуть перезаписати стилі Webflow navbar, footer, інших секцій.

---

### Секція 2 — CSS-змінні та базовий layout (рядки ~17–465)

Токени на `#sm-library-scope`:
- `--bg`, `--panel`, `--panel-2`, `--line`, `--line-2` — фони і розділювачі
- `--text`, `--muted` — кольори тексту
- `--accent: #c99a6e` (золото), `--accent2`, `--purple: #783be2`
- `--pad: 16px`, `--gap: 16px`, `--side: 300–320px` (ширина sidebar)
- `--z-drawer: 99999`, `--z-modal: 100000`, `--sm-player-vh`, `--sm-plan-vh`

Базові елементи:
- `.library` — CSS grid `var(--side) minmax(0,1fr)`
- `.results__grid` — `repeat(auto-fill, minmax(260px, 320px))`
- `.card`, `.cardPlan` — картки moves/plans (базові стилі)
- `.assistant`, `.chat`, `.msg--bot`, `.msg--user` — filter drawer
- `.btn`, `.btn--ghost` — кнопки

---

### Секція 3 — Mobile portrait layout (рядки ~400–1730)
**Медіа: `(max-width: 900px) and (orientation: portrait)`**

Ключові класи:
- `.sm-pro-mobile-top` — заголовок Pro Library (h1 + subtitle), `display: none` глобально, `display: block` у portrait
- `.sm-pro-mobile-tabs` — таб-бар (All/Moves/Plans/Packs/Saved), `display: none` глобально, `display: grid` у portrait
- `.sm-pro-filter-hero` — hero фільтру зі сегментами прогресу (динамічно інжектується JS)
- `.sm-pro-filter-segment`, `.sm-pro-filter-segment.is-active`, `.sm-pro-filter-segment.is-done`
- `.sm-pro-filter-screen` — клас на `.assistant` при мобільному portrait-mode
- `.sm-env-card`, `.sm-env-card__img`, `.sm-env-card__paint`, `.sm-env-card__label` — картки середовища (крок 1 фільтру)
- `.sm-env-art-mountains`, `.sm-env-art-city`, `.sm-env-art-forest`, `.sm-env-art-beach`, `.sm-env-art-near`, `.sm-env-art-open` — art-overlay класи
- `.sm-pro-pill-grid`, `.sm-pro-pill-grid--desktop` — сітка кнопок-пілюль
- `.sm-pro-step-copy`, `.sm-pro-step-copy--final` — текст поточного кроку
- `.sm-pro-filter-show-bottom` — кнопка "Show N results" у footer drawer
- `.sm-pro-filter-warning` — попередження "No matching results"

---

### Секція 4 — Mobile landscape layout (рядки ~1200–1400 і ~1307–1395)
**Медіа: `(max-height: 560px) and (orientation: landscape)`**

- `.library` → `grid-template-columns: 1fr` (одна колонка)
- `.results__grid` → `repeat(4, minmax(0, 1fr))`, gap 12px
- `.mobile-open` → `display: flex` (фільтр-кнопка видима)
- `.assistant` → `height: 100dvh`
- `.sm-pro-mobile-tabs` → `display: grid` (таб-бар видимий у landscape) ← **додано у responsive fix**
- Підблок `(max-width: 760px)` → grid 3 колонки

---

### Секція 5 — Cards/Grid (рядки ~2015–4000)

Картки moves:
- `.card` — базова картка, `min-height: 220px`, `.thumb img`, `.meta`, `.title`, `.badge`, `.sm-save`
- `.sm-pro-difficulty-pill`, `.sm-pro-difficulty-pill--basic/intermediate/advanced` — кольорові пілюлі складності
- `.sm-pro-move-row` — list-view рядок ходу (`.sm-pro-move-row__media`, `__body`, `__top`, `__meta`, `__tags`)
- `.sm-pro-move-list` — контейнер list-view

Картки plans:
- `.cardPlan` — картка плану (`.planMedia`, `.planPills`, `.planCaption`, `.planBubble`, `.planType`, `.planMeta`)
- `.pill`, `.pill--plan` — бейджі на картці
- ⚠ `.cardPlan .planBubble { display: none }` в mobile portrait — тип плану прихований

Розділові блоки:
- `.sm-pro-section-head` — заголовок секції з "View all" кнопкою
- `.sm-pro-section-link` — кнопка-посилання `[data-pro-go-tab]`
- `.sm-skeleton-card`, `.sm-skeleton-fill` — loading skeleton

---

### Секція 6 — Pro subscreens CSS (рядки ~4000–5822)

- `.sm-pro-tab-screen` — обгортка subscreen
- `.sm-pro-tool-header` — tool header з back кнопкою і search/filter іконкою
- `.sm-pro-tool-back`, `.sm-pro-tool-title`, `.sm-pro-tool-badge`, `.sm-pro-tool-search`, `.sm-pro-tool-icon`
- `.sm-pro-screen-head` — заголовок екрану з лічильником
- `.sm-pro-level-tabs` — Basic/Intermediate/Advanced/Saved вкладки
- `.sm-pro-searchbar`, `.sm-pro-searchbar__inner`, `.sm-pro-searchbar__icon`, `.sm-pro-searchbar__clear`
- `.sm-pro-content-count-row`, `[data-pro-content-count]` — рядок лічильника
- `.sm-pro-empty` — empty state (h3 + p)
- `.sm-pro-plan-grid`, `.sm-pro-plan-poster-grid` — сітки планів
- `.sm-pro-pack-row`, `.sm-pro-pack-card`, `.sm-pro-pack-card__img`, `.sm-pro-pack-content`
- `.sm-pro-pack-plan-card`, `.sm-pro-pack-plan-card__img`, `.sm-pro-pack-plan-card__body`
- `.sm-pro-pack-move-card` — картка ходу у пакеті

---

### Секція 7 — KNOWN DUPLICATE мінімальний (рядки ~2005–2015)
**Дубль Plan Viewer — мінімальний блок**

Містить лише 2–3 правила:
- `#sm-plan-v3-root .spv3[aria-hidden="true"] { display: none }`
- `#sm-plan-v3-root .spv3[aria-hidden="false"] { display: block }`
- Частково `.spv3__close` override

Ці правила повністю покриті основним блоком (~рядки 5836+). **Safe to remove.**

---

### Секція 8 — KNOWN DUPLICATE Plan Viewer повний (рядки ~5836–6207)
**⚠ Дублює plan-viewer-v3.css — MEDIUM-RISK для видалення**

Повний набір стилів `#sm-plan-v3-root`:
- `.spv3`, `.spv3__backdrop`, `.spv3__dialog`, `.spv3__close`
- `.spv3__viewport`, `.spv3__track`, `.spv3__slide`, `.spv3__dots`, `.spv3Dot`
- `.spv3PlayBtn`, `.spv3PlayIcon`
- `.spv3Result`, `.spv3Result__video`, `.spv3Result__overlay`, `.spv3Result__title`
- `.spv3Step`, `.spv3Step__top`, `.spv3Step__poster`, `.spv3Step__overlay`, `.spv3Step__bottom`
- `.spv3Montage`, `.spv3TimelineFlow`, `.spv3TimelineFlow__clip`, `.spv3TimelineFlow__cut`, `.spv3TimelineFlow__transition`
- Медіа: `max-width:900px`, `max-width:640px`, `max-height:560px and orientation:landscape`

**Конфлікти з plan-viewer-v3.css:**
| Властивість | library-pro.css | plan-viewer-v3.css |
|---|---|---|
| `.spv3` z-index | `100500` | `100000` |
| `.spv3__close top` | `calc(14px + env(safe-area-inset-top))` | `18px` |
| `.spv3__close right` | `14px` | `22px` |
| `.spv3__dialog background` | `#050607` | складний градієнт |

Перемагає той файл, що завантажується пізніше. Зараз порядок: `library-pro.css` → `plan-viewer-v3.css`, тому **перемагає `plan-viewer-v3.css`**.

---

### Секція 9 — Desktop layout (рядки ~6200–8000)
**Медіа: `min-width: 901px`, `min-width: 1024px`, `min-width: 1280px`**

- `.library` → grid `var(--side) minmax(0,1fr)`, `min-height: 100dvh`
- `.assistant` → `position: sticky; top: 18px; height: calc(100dvh - 36px)` ← **виправлено з 100vh**
- `.sm-pro-mobile-top`, `.sm-pro-mobile-tabs` → `display: none` (ховаються на desktop)
- `.mobile-open`, `.assistantBackdrop` → `display: none`
- `.sm-pro-desktop-filter`, `.sm-pro-desktop-home`, `.sm-pro-desktop-home-grid`
- `.sm-pro-desktop-plan-grid`, `.sm-pro-desktop-move-stack`
- Великий desktop: `.sm-pro-pack-detail` responsive scaling для `min-width: 1280px`

---

### Секція 10 — Pack detail + overflow overrides (рядки ~8000–11013)

- `html.sm-pack-detail-open, body.sm-pack-detail-open` — скидання `overflow` для Pack Detail scroll
- `#sm-library-scope.sm-pro-pack-detail-active` — перемикання режиму pack detail
- `.sm-pro-pack-detail` — основний контейнер pack detail
- `.sm-pro-pack-detail__hero`, `.sm-pro-pack-detail__body`, `.sm-pro-pack-detail__lessons`
- `.sm-pro-pack-checklist`, `.sm-pro-pack-checklist__sheet` — чеклісти
- `.sm-basic-plan-viewer` — fallback plan viewer (⚠ **unscoped**, ризик витоку)
  - `.sm-basic-plan-viewer__panel`, `__hero`, `__body`, `__close`, `__steps`, `__step`

---

### Секція 11 — Late override patches (рядки ~11000–кінець)

- Детальний CSS Pro subscreens (Moves/Plans/Packs для різних breakpoints)
- Landscape phone fixes для Plans screen (`max-height:560px and orientation:landscape`)
- Фінальні `!important` override-блоки для pack detail на великих екранах
- Needs manual verification: деякі блоки можуть бути застарілими patch-ами

---

## plan-viewer-v3.css — Секції

| Секція | Рядки | Що містить |
|---|---|---|
| CSS-змінні + base | 0–16 | `--z:100001`, `--gold:#c99a6e`, `--violet:#783be2`, `font-family` |
| Modal overlay | 17–200 | `.spv3`, `.spv3__backdrop`, `.spv3__dialog`, `.spv3__close`, `.spv3Dot` |
| Play button | 167–203 | `.spv3PlayBtn`, `.spv3PlayIcon` |
| Result slide | 205–264 | `.spv3Result`, `__video`, `__overlay`, `__title` |
| Step slide | 264–350 | `.spv3Step` (grid 72%/28%), `__top`, `__overlay`, `__title`, `__powered`, `__bottom` |
| Timeline | 352–500 | `.spv3Montage`, `.spv3TimelineFlow`, `__clip`, `__num`, `__name`, `__dur`, `__cut`, `__transition` |
| Tablet 900px | 506–579 | Адаптація розмірів для 900px |
| Phone 640px | 581–693 | Font-size 9px для `.spv3TimelineFlow__transition` ← **виправлено з 7px** |
| Small phone low height | 695–712 | `max-height:760px` |
| Landscape phone | 716–878 | `max-height:560px and orientation:landscape` — timeline острівець, font-size 8px ← **виправлено** |
| ⚠ Другий `#sm-plan-v3-root` блок | 881–930 | `position:static !important; width:0 !important; height:0 !important` — Webflow embed workaround, конфліктує з першим блоком |

---

## CSS-класи, що встановлюються через JS (не шукати як "мертві")

| Клас | Хто встановлює | На якому елементі |
|---|---|---|
| `sm-pro-filter-screen` | `openAssistant()` | `.assistant` |
| `sm-pro-desktop-filter` | `renderDesktopStepScreen()` | `.assistant` |
| `sm-pro-reject` | `showNoMatch()` | `.assistant` |
| `sm-pro-subscreen` | `setProTab()` | `#sm-library-scope` |
| `sm-pro-pack-detail-active` | `renderProPackDetailScreen()` | `#sm-library-scope` |
| `sm-pack-detail-open` | `setPackDetailPageMode()` | `html`, `body` |
| `is-attention` | `shakeFiltersButton()` | `#openAssistantBtn` |
| `isSaved` | `setMoveSaveUi()` | `.sm-save` |
| `is-active` | `setProTab()`, `buildDots()` | tab buttons, `.spv3Dot` |
| `is-open` | `toggleProSearch()` | `.sm-pro-searchbar` |
| `is-visible` | `setRotateHintVisible()` | `#rotateHint` |
| `is-shaking` | `showNoMatch()` | `.opt` кнопка |
| `sm-pro-desktop-home-grid` | `renderProDesktopHome()` | `#resultsGrid` |
| `isPlan` | `setModal()` в openPlayer | `#modal` |
| `sm-env-visual-mode` | `renderMobileStepScreen()` | `.chat` |
