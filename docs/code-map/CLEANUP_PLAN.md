# CLEANUP PLAN — SkyMotion Pro Library

Порядок cleanup від найбезпечнішого до найризикованішого.
Кожен етап потребує ручного тесту перед переходом до наступного.

---

## Що вже виконано (completed)

| Що | Де | Результат |
|---|---|---|
| Видалено `console.info` | `library-pro.js` рядок 3 | ✅ |
| Видалено першу дубльовану `isProMobilePortrait()` | `library-pro.js` ~рядок 1095 | ✅ |
| Видалено мертвий v8-блок (setProTab→renderProSavedScreen) | `library-pro.js` рядки 1734–2233 | ✅ |
| Відновлено 18 utility-функцій, видалених помилково | `library-pro.js` рядки ~1730–1950 | ✅ |
| Замінено `100vh → 100dvh` для sidebar | `library-pro.css` рядки 6305, 6876 | ✅ |
| Додано Pro tabs у landscape phone | `library-pro.css` | ✅ |
| Збільшено font-size transition labels | `plan-viewer-v3.css` рядки 690, 824 | ✅ |
| Виправлено subtitle filter hero | `library-pro.js` рядок 1140 | ✅ |
| Додано `viewport-fit=cover` | `index.html` рядок 5 | ✅ |
| Підключено plan-viewer-v3.css, .js, DOM | `index.html` | ✅ |

---

## Етап 1 — Safe (нульовий або мінімальний ризик)

### 1.1 Видалити мінімальний дублікат Plan Viewer CSS
**Файл:** `library-pro.css`, рядки ~2005–2015
**Що:** 2–3 правила `#sm-plan-v3-root .spv3[aria-hidden]` і `.spv3__close` поза основним блоком
**Ризик:** Нульовий — правила повністю покриті основним блоком на рядках ~5836+
**Тест після:**
- Відкрити Plan Viewer → переконатись що показується/ховається коректно
- Перевірити позицію кнопки закриття

---

## Етап 2 — Medium (потребує ручного тесту)

### 2.1 Видалити дублікат Plan Viewer CSS-блок з library-pro.css
**Файл:** `library-pro.css`, рядки ~5836–6207 (~370 рядків)
**Що:** Повний `#sm-plan-v3-root` блок, що дублює `plan-viewer-v3.css`
**Ризик:** ⚠ MEDIUM

Перед видаленням обов'язково перевірити:
1. **Canonical source для Webflow:** чи завантажується `plan-viewer-v3.css` на Webflow-сторінці production? Якщо ні — `library-pro.css` є єдиним джерелом стилів Plan Viewer.
2. **Порівняти CSS:** чи всі правила у ~5836–6207 є в `plan-viewer-v3.css`? Зокрема значення `z-index:100500` (у lib) vs `100000` (у v3.css) — різні значення.
3. **Local dev:** перевірити Plan Viewer у `index.html` після видалення

**Тест після:**
- Desktop: відкрити план, свайпнути між слайдами, перевірити backdrop, close button позицію
- Mobile portrait: відкрити план, dots видні над home indicator
- Landscape phone: timeline острівець у нижньому правому куті
- `z-index` — Plan Viewer відображається поверх всього

### 2.2 Видалити другий `#sm-plan-v3-root` блок з plan-viewer-v3.css
**Файл:** `plan-viewer-v3.css`, рядки 881–930
**Що:** `position:static !important; width:0 !important; height:0 !important` Webflow workaround
**Ризик:** ⚠ MEDIUM

Перед видаленням:
1. Перевірити чи `#sm-plan-v3-root` займає місце у Webflow layout коли modal закритий
2. Якщо займає — workaround потрібен, не видаляти
3. Якщо ні (наприклад, plan-viewer вже позиціонований поза потоком) — можна видаляти

**Тест після:**
- Перевірити що Plan Viewer не займає вертикальне місце на сторінці коли закритий
- Відкрити і закрити Plan Viewer → layout бібліотеки не зміщується

### 2.3 Перемістити глобальні CSS правила до scoped
**Файл:** `library-pro.css`, рядки 0–15
**Що:** `* { box-sizing }`, `html,body { background:#121212 }`, `body { color, font-family }` — unscoped
**Ризик:** ⚠ MEDIUM

Варіанти:
- `* { box-sizing }` — universal reset, зазвичай безпечний, залишити як є
- `html, body { background }` — перемістити до `#sm-library-scope` або прибрати якщо Webflow page має власний фон
- `body { color, font-family }` — перемістити до `#sm-library-scope` або `#sm-plan-v3-root`

Перед: перевірити Webflow page повністю (nav, footer, інші секції).

**Тест після:**
- Webflow production: перевірити navbar, footer, інші секції — шрифт і колір не змінились
- Pro Library: картки, текст, кнопки виглядають як раніше

### 2.4 Scoped `.sm-basic-plan-viewer` CSS
**Файл:** `library-pro.css`, рядки ~10997–11013
**Що:** Клас `.sm-basic-plan-viewer` не має `#sm-library-scope` prefix → глобальний
**Ризик:** ⚠ MEDIUM (впливає лише якщо fallback viewer активний)

`ensureBasicPlanViewer()` appends до `document.body`, тому scope `#sm-library-scope` **не застосовний**. Клас повинен залишатись глобальним або бути перенесений до `body > .sm-basic-plan-viewer` selector.

**Не видаляти** — лише оцінити risk exposure.

---

## Етап 3 — High Risk (лише після повного ручного тесту в Webflow production)

### 3.1 Стандартизація scroll-lock систем
**Файли:** `library-pro.js` + `plan-viewer-v3.js`
**Що:** Три незалежних системи lock/unlock: `applyOverflow()`, `setBodyLock()`, `ensureBasicPlanViewer.open()`
**Ризик:** 🔴 HIGH — будь-яка помилка → замороженний скрол на mobile

Рекомендований підхід:
1. Додати CustomEvent `sm:plan-viewer-lock-changed` у `plan-viewer-v3.js`
2. `library-pro.js` слухає і викликає `applyOverflow()`
3. Не змінювати внутрішній стан `locks` об'єкта напряму

**Тест після:**
- Open/close Plan Viewer: скрол відновлюється
- Open Pack Detail → Open Plan Viewer → Close: Pack Detail scrollable
- Open Move Player → Close: скрол відновлюється
- Open Filter Drawer → Close: скрол відновлюється
- Комбінації: Pack Detail → Plan Viewer → Move Player → закрити все

### 3.2 Стандартизація z-index між файлами
**Файли:** `library-pro.css` (~5839), `plan-viewer-v3.css` (~36)
**Що:** `100500` vs `100000` — різні значення
**Ризик:** 🔴 HIGH — Plan Viewer може опинитись під move player modal

**Тест після:** Plan Viewer відображається поверх всіх модалів, drawer, pack detail

---

## Checklist перед будь-яким cleanup

- [ ] Зробити git commit поточного стану перед початком
- [ ] Перевірити `git diff` після правки
- [ ] Відкрити index.html локально та виконати smoke test
- [ ] Перевірити Webflow staging якщо зміна CSS
- [ ] Перевірити mobile portrait + mobile landscape + desktop
- [ ] Перевірити Plan Viewer відкриття і закриття
- [ ] Перевірити save/unsave move (localStorage не зламався)

---

## Smoke Test після будь-якого cleanup

1. Сторінка завантажується без JS-помилок у консолі
2. Картки рендеряться (не "Failed to load videos")
3. Всі 5 вкладок перемикаються (All/Moves/Plans/Packs/Saved)
4. Фільтри відкриваються і закриваються
5. Move card → відеоплеєр відкривається і закривається
6. Plan card → Plan Viewer v3 відкривається (не fallback)
7. Save move → іконка змінюється без reload
8. Pack Detail → відкривається і закривається, скрол відновлюється
