# WEBFLOW CLEANUP AUDIT

Мета: підготувати проєкт до перенесення у Webflow — лишити **тільки прод-код**, прибрати тестове, референсне, мертве та дублі. Нічого не видаляємо без узгодження. Кожен етап — зі smoke-тестом.

> Що реально «їде» у Webflow = ембед бібліотеки: **DOM-розмітка** (з `index.html`) + **CSS** + **JS** + дані з **CDN**. Окремі сторінки (лендінг, login/signup) — це інші Webflow-сторінки, не частина ембеда бібліотеки.

---

## 1. Інвентар файлів

### ✅ Production — їде у Webflow (лишити)

| Файл | Роль | Дія |
|---|---|---|
| `index.html` | DOM-скелет бібліотеки + конфіг (`window.*`) + інлайн-інжектори (gating, last-watched, filter-drawer helper) | Лишити. Винести тест-конфіг (див. нижче). Інжектори — це прод-логіка. |
| `css/sm-tokens.css` | CSS-змінні (кольори, відступи) | Лишити |
| `css/sm-layout.css` | Базова сітка, assistant, header | Лишити |
| `css/sm-cards.css` | Картки рухів | Лишити |
| `css/sm-filters.css` | Фільтр (база) | Лишити |
| `css/sm-player-modal.css` | Відеоплеєр | Лишити |
| `css/sm-responsive-mobile.css` | Мобільні правила | Лишити |
| `css/sm-filter-mobile.css` | Мобільний фільтр (⚠ містить мертвий Pro Shoot Builder — див. §3) | Лишити, почистити |
| `css/sm-subscreens.css` | Підсторінки Moves/Plans/Packs/Saved | Лишити |
| `css/sm-desktop.css` | Десктоп-розкладка (⚠ містить мертвий `.sm-pro-desktop-filter`) | Лишити, почистити |
| `css/sm-pack-detail.css` | Деталі паку | Лишити |
| `css/sm-skin.css` | Мій overlay цієї сесії (gating, free-style фільтр, картки, Saved, badge тощо) | Лишити, **консолідувати дублі** (§3) |
| `library-pro.js` | Весь runtime бібліотеки | Лишити; прибрати мертві Pro-filter гілки (§3) |
| `plan-viewer-v3.css` | Стилі Plan Viewer | Лишити |
| `plan-viewer-v3.js` | Plan Viewer runtime | Лишити |
| `library-pro.css` | ⚠ **Дублює** частину `css/` split-файлів + містить блок Plan Viewer CSS | **Розслідувати + дедуп** (§3, найбільший виграш і ризик) |

### 🧪 Тестове — не для проду (dev-flag / прибрати з ембеда)

| Файл / частина | Що | Дія |
|---|---|---|
| `library-data-pro.json` | Локальні тест-дані (33 рухи + 10 планів) | Лишити для локалки; у проді дані з CDN |
| `window.SM_LIBRARY_DATA_URL = "./library-data-pro.json"` (index.html) | Перемикач на локальні дані | У проді прибрати/закоментувати → fallback на CDN `videos_index_v16.json` |
| `SM_PRO_PACK_TITLE="Test Pack"`, `SM_PRO_PACK_CREATOR="Creator Name"` тощо | Плейсхолдер-пак | Замінити на реальні значення паку |

### 📎 Референс — окремі сторінки / джерело, не ембед бібліотеки (лишити окремо)

| Файл | Роль | Дія |
|---|---|---|
| `landing.html` | Лендінг (окрема Webflow-сторінка) | Лишити як референс, **не чіпати** |
| `webflow/login.html`, `signup.html`, `README.md` | Дзеркала Webflow auth-ембедів | Лишити як референс |
| `webflow/free-library/free-library.html`, `sm-library-v40.js` | Free-бібліотека (еталон фільтра) | Лишити як референс |

### 🗑 Кандидати на видалення — старі прототипи (перевірити, що ніде не лінкуються)

| Файл | Підозра | Дія |
|---|---|---|
| `landing-v2.html` | Старий варіант лендінгу | Ймовірно прибрати |
| `pro-redesign.html` | Прототип редизайну | Ймовірно прибрати |
| `pro-checklist.html` | Прототип чеклісту | Ймовірно прибрати |
| `pro-pack.html` | Прототип паку | Ймовірно прибрати |
| `pro-hero-options.html` | Прототип hero | Ймовірно прибрати |

### 📚 Docs / dev-tooling — лишити в репо, НЕ у Webflow

| Файл | Дія |
|---|---|
| `docs/code-map/*` (PROJECT_STRUCTURE, CSS_MAP, JS_MAP, DANGER_ZONES, PLAN_VIEWER_MAP, CLEANUP_PLAN) | Лишити, **оновити** (застаріли — зроблені до спліту CSS і до цієї сесії) |
| `docs/changelog.md`, `docs/notes.md` | Лишити |
| `.claude/agents/*` | Кастомні агенти (dev-tooling) | Лишити, не у Webflow |
| `CLAUDE.md` | Контекст проєкту | Лишити, не у Webflow |

---

## 2. Найбільші можливості (за пріоритетом)

| # | Що | Виграш | Ризик |
|---|---|---|---|
| 1 | **`library-pro.css` vs `css/` split** — обидва завантажуються, дублюють селектори (картки, count, pill — підтверджено). Найбільше за обсягом. | 🔥 великий | 🔴 потребує точного diff |
| 2 | **Мертвий Pro «Shoot Builder» фільтр**: `.sm-pro-filter-screen` (sm-filter-mobile.css) + `.sm-pro-desktop-filter` (sm-desktop.css) + відповідні гілки в library-pro.js. Не використовується (`SM_FREE_STYLE_FILTER=true`). | великий | 🟡 низько-середній |
| 3 | **Прототипи** `pro-*.html`, `landing-v2.html` | середній | 🟢 низький (перевірити лінки) |
| 4 | **Тест-дані → CDN** + реальний пак | малий | 🟢 низький |
| 5 | **sm-skin.css**: прибрати перекриті/дубльовані правила цієї сесії + поправити зламані коментарі `\*`→`/*` | малий | 🟡 низько-середній (робочий файл) |

---

## 3. Danger zones — НЕ чіпати без обережності

(детально — `docs/code-map/DANGER_ZONES.md`)

- **Auth/Memberstack**, **Backend API** (`/v1/me/access`, `/v1/saved-moves`, `/v1/saved-items`)
- **Saved-moves logic** (localStorage + API)
- **Event-bridge**: `sm:open-plan`, `sm:reopen-plan-after-player`, `sm:open-move-player` — **не перейменовувати**
- **Scroll-lock** (3 системи: `applyOverflow`, `setBodyLock`, basic viewer)
- **z-index Plan Viewer** (`100500` vs `100000` — звірити)
- **IIFE guards** (`__SM_LIBRARY_V1_CLEAN_SPLIT__`, `__SM_PLAN_VIEWER_V3__`)
- **Фільтр-питання/кроки** (тільки візуал чіпали, логіку — ні)

---

## 4. Питання, які треба підтвердити перед видаленням

1. **`library-pro.css`** — це старий моноліт, з якого винесли `css/` split-файли? Якщо так — `css/` = canonical, а дубльовані блоки в `library-pro.css` можна прибирати (після diff). Підтверди.
2. **Прототипи** `pro-redesign / pro-checklist / pro-pack / pro-hero-options / landing-v2` — точно прибираємо?
3. **Дані в проді** — CDN `videos_index_v16.json` фінальний, чи буде новий індекс?
4. **`SM_FREE_STYLE_FILTER`** лишається `true` назавжди (тоді Pro Shoot Builder можна сміливо видаляти)?

---

## 5. Порядок виконання (після узгодження)

- **Етап 1 — safe:** прибрати прототипи (`pro-*.html`, `landing-v2.html`); перемкнути дані на CDN; поправити коментарі `\*`. → smoke-тест.
- **Етап 2 — medium:** видалити мертвий Pro Shoot Builder (CSS+JS); причесати `sm-skin.css`. → smoke-тест.
- **Етап 3 — high:** дедуп `library-pro.css` ↔ `css/` (точний diff, поетапно). → повний smoke-тест.

**Smoke-тест після кожного етапу:** сторінка без помилок у консолі → картки рендеряться → 5 табів → фільтр відкр/закр → плеєр відкр/закр → Plan Viewer (не fallback) → save/unsave → pack detail (скрол відновлюється).
