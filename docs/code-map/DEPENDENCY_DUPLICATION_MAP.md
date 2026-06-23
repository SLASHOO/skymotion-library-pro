# DEPENDENCY + DUPLICATION MAP — library-pro.css ↔ css/

> Побудовано напряму з файлів (CSSOM-парсинг + читання). **Нічого не видалено.** Це список для узгодження.
> Метод: зібрано всі селектори з кожного stylesheet, знайдено перетини library-pro.css ↔ css/* split, перевірено медіа-контекст і декларації.

---

## 0. Головний висновок (виправляє аудит)

Гіпотеза аудиту «`library-pro.css` — старий моноліт, що дублює `css/`, великий безпечний dedup» — **ХИБНА**.

- `library-pro.css` = **1156 рядків / 95 селекторів** (не 16000 — стара документація застаріла).
- Він завантажується **ПІСЛЯ** усіх `css/` split-файлів → у будь-якому конфлікті **виграє library-pro.css**.
- Його вміст — це: (а) глобальні ресети, (б) **шар мобільних оверрайдів** `@media (max-width:900px) portrait`, (в) **мертвий блок desktop-фільтра** (Shoot Builder).
- Перетин 95 селекторів з `css/`: **57 збігів** — але з них **16 = мертвий фільтр**, а решта **41 — це ті самі селектори в РІЗНИХ медіа-контекстах** (мобілка в library-pro.css vs десктоп/база в `css/`). Це **шарування, а не редундантність**.

**Реального великого безпечного dedup тут немає.** Видалення мобільних правил library-pro.css зламає мобільний портрет.

---

## 1. Анатомія library-pro.css (95 селекторів)

| Рядки | Блок | Медіа | Призначення |
|---|---|---|---|
| 1–16 | Глобальні ресети | — | `*`, `html,body`, `body` |
| 18–281 | Mobile home / cards / packs | `max-width:900/420 portrait` | Картки рухів, featured pack, plan-картки |
| 286–294 | difficulty-pill base + assistant__close | — | базове приховування |
| 296–653 | Type / cleanup / restrained typography | `max-width:900/420 portrait` | Пілли рівня, типографіка |
| 657–778 | Header (calmer + 2-line titles) | `max-width:900/420 portrait` | Заголовок, бейдж, 2-рядкові назви |
| 781–810 | Saved items | — | `.sm-pro-pack-save.isSaved`, saved-subtitle/list |
| 814–943 | Plans screen | mobile + landscape | `.sm-pro-plans-screen .cardPlan` варіанти |
| 949–1014 | Move-row difficulty pill v99 | base + portrait | `.sm-pro-move-row__meta` |
| **1016–1156** | **v124 DESKTOP FILTER (Shoot Builder)** | `min-width:901px` | **МЕРТВИЙ — див. §3** |

---

## 2. Перетин селекторів library-pro.css ↔ css/

### 2A. Мертвий Shoot Builder — 16 селекторів (library-pro.css 1016–1156 ↔ sm-desktop.css)

Усі під `.assistant.sm-pro-desktop-filter`:
`.sm-pro-desktop-filter`, ` #backBtn`, ` #resetBtn`, ` .assistant__count`, ` .assistant__count:hover`, ` .assistant__header`, ` .filterProgress`, ` .filterProgress__bar`, ` .options.sm-pro-pill-grid .opt`(+`:hover`,`:focus-visible`), ` .options.sm-pro-pill-grid--desktop .opt`(+`:hover`,`:focus-visible`), ` .sm-pro-filter-show-bottom`, `.sm-pro-desktop-filter.sm-pro-filter-screen`.

→ **Прибираються разом із рішенням по Shoot Builder (§3).** Не чіпати окремо.

### 2B. Медіа-розділені (НЕ редундантні) — 41 селектор

Ті самі селектори, але в library-pro.css вони в `@media (max-width:900px) portrait`, а в css/ — у `@media (min-width:901px)` або базові. **Обидва потрібні. Не видаляти.**

**library-pro.css (mobile) ↔ sm-desktop.css (desktop @901px / base) — 26:**
`.sm-pro-difficulty-pill`, `.sm-pro-pack-badge`, `.sm-pro-pack-card`, `.sm-pro-pack-content`, `.sm-pro-pack-content h3`, `.sm-pro-pack-content p`, `.sm-pro-pack-img`, `.sm-pro-pack-meta`, `.sm-pro-pack-meta span:not(:last-child)::after`, `.sm-pro-pack-save`, `.sm-pro-pack-save svg`, `.sm-pro-pack-save.isSaved`, `.sm-pro-pack-shade`, `.sm-pro-plans-screen .cardPlan`, `… .cardPlan .pill`, `… .planBubble`, `… .planCaption`, `… .planMeta`, `… .planPills`, `… .planType`, `.sm-pro-plan-grid`, `.sm-pro-plan-poster-grid`, `.sm-pro-saved-pack-list`, `.sm-pro-section-head`, `.sm-pro-section-head h2`, `.sm-pro-section-link`.

Підтверджено: у sm-desktop.css `.sm-pro-pack-card`→рядок 290/857/1290 (desktop media), `.sm-pro-section-head`→260/828 (desktop), `.cardPlan`→3914 (база) + 4092 (desktop). У library-pro.css ті ж селектори — лише в portrait. ✅ Шарування.

### 2C. Глобальні ресети — 2 (справжній дубль, мінімальний)

`html`, `body` — є в library-pro.css (1–16), sm-desktop.css і sm-pack-detail.css. Це повторені глобальні ресети. **Єдиний реальний кандидат на консолідацію**, але ризик: впливає на всю Webflow-сторінку (nav/footer). Тримати один canonical, інші прибрати — лише після перевірки ідентичності значень.

### 2D. Same-media overlap із sm-filter-mobile.css (мобілка↔мобілка) — навмисне шарування

`.sm-pro-badge`, `.sm-pro-mobile-tabs button`, `.sm-pro-mobile-tabs button.is-active`, `.mobile-open` — є і в sm-filter-mobile.css (`@media max-width:900 portrait`, рядки 110/165/177/132) і в library-pro.css (ті ж медіа, пізніші v-блоки з `!important`). sm-filter-mobile.css = базовий мобільний shell; library-pro.css = пізніше уточнення типографіки. library-pro.css виграє (порядок + `!important`). **Можна злити в один файл, але цінність низька, ризик середній.** Не чіпати на цьому етапі.

---

## 3. Shoot Builder — ізоляція (НЕ видалено)

**Один вимикач:** `library-pro.js:878` → `const SM_FREE_STYLE_FILTER = true;`
`filterUsesProUi()` (879) = `!SM_FREE_STYLE_FILTER && (...)` → **завжди `false`**. Тому весь Pro-фільтр (Shoot Builder) сплячий.

**Компоненти, що використовують Shoot Builder (усі за прапорцем):**

JS (`library-pro.js`):
- `filterUsesProUi()` — 879 (єдине джерело істини)
- `ensureFilterHero()` — 1116–1131: якщо `!useProFilterScreen` → знімає класи, `return null`
- Гілки рендера Pro pill-grid — 631, 1117–1125, 1266, 1277, 1327, 1355 (desktop hero), 1384, 1416–1421
- Активне **зняття** класів при прапорці — 1413–1414, 1463, 1490, 4125 (код самоочищається)

CSS:
- `.sm-pro-desktop-filter` — sm-desktop.css **+ library-pro.css 1016–1156**
- `.sm-pro-filter-screen` — sm-filter-mobile.css (833–1191+)
- `.sm-pro-pill-grid` / `--desktop`, `.sm-pro-filter-hero`

**Реактивація:** `SM_FREE_STYLE_FILTER = false` — і Shoot Builder вмикається.
**Архівувати vs видалити:** усе зав'язане на один прапорець + префікс `.sm-pro-*-filter*`. Ізоляція чиста й оборотна. Рішення за тобою — нічого не роблю, поки не скажеш.

---

## 4. Прототипи — підтверджено

5 файлів існують, **0 реальних посилань** (href/src/fetch/import). Збіги в коді — лише імена класів (`.sm-pro-pack-*` тощо), не лінки.

`landing-v2.html`, `pro-redesign.html`, `pro-checklist.html`, `pro-pack.html`, `pro-hero-options.html`

⚠ **Не вдалося видалити цієї сесії:** Linux-shell недоступний (брак диску на VM). Видалю, щойно підніметься workspace, або прибери вручну — вони безпечні.

---

## 5. Рекомендація (після узгодження)

| Дія | Безпека | Примітка |
|---|---|---|
| Видалити 5 прототипів | 🟢 | чекає на shell |
| Видалити мертвий Shoot Builder (CSS 2A + JS-гілки + filter-mobile/desktop блоки) | 🟡 | разом, за одним прапорцем; архів рекомендований |
| Консолідувати `html/body` глобалі (2C) | 🟡 | звірити значення, перевірити Webflow nav/footer |
| Злити mobile-refinement шари 2D | 🟠 | низька цінність, не зараз |
| **НЕ чіпати** 41 медіа-розділений селектор (2B) | 🔴 | зламає мобільний портрет |
