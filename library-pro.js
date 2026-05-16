(() => {
  "use strict";

  if (window.__SM_LIBRARY_PRO_V02__) return;
  window.__SM_LIBRARY_PRO_V02__ = true;

  const DATA_URL = window.SM_LIBRARY_DATA_URL || "./library-data-pro.json";
  const FALLBACK_THUMB = "https://skymotion-cdn.b-cdn.net/thumb.jpg";

  const root = document.getElementById("sm-library-pro");

  if (!root) {
    console.error("[SM PRO] Missing #sm-library-pro root");
    return;
  }

  const state = {
    data: {
      moves: [],
      plans: [],
      packs: []
    },
    activeTab: "all",
    view: "library",
    activePackId: null,
    modal: null,
    saved: loadLocalSaved()
  };

  function loadLocalSaved() {
    try {
      const raw = localStorage.getItem("sm_pro_saved_items");
      const parsed = JSON.parse(raw || "[]");
      return Array.isArray(parsed) ? parsed : [];
    } catch (_) {
      return [];
    }
  }

  function saveLocalSaved() {
    try {
      localStorage.setItem("sm_pro_saved_items", JSON.stringify(state.saved));
    } catch (_) {}
  }

  function getSavedKey(type, id) {
    return `${type}:${id}`;
  }

  function isSaved(type, id) {
    return state.saved.includes(getSavedKey(type, id));
  }

  function toggleSaved(type, id) {
    const key = getSavedKey(type, id);

    if (state.saved.includes(key)) {
      state.saved = state.saved.filter((item) => item !== key);
    } else {
      state.saved.push(key);
    }

    saveLocalSaved();
    renderApp();
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function formatSeconds(seconds) {
    const n = Number(seconds || 0);
    if (!Number.isFinite(n) || n <= 0) return "";
    const m = Math.floor(n / 60);
    const s = Math.floor(n % 60);
    return `${m}:${String(s).padStart(2, "0")}`;
  }

  function getDifficultyLabel(value) {
    const key = String(value || "").toLowerCase();

    const map = {
      basic: "Basic",
      intermediate: "Intermediate",
      advanced: "Advanced"
    };

    return map[key] || "Basic";
  }

  function getDifficultyClass(value) {
    const key = String(value || "").toLowerCase();

    if (key === "advanced") return "is-advanced";
    if (key === "intermediate") return "is-intermediate";
    return "is-basic";
  }

  function getImageUrl(value) {
    const url = String(value || "").trim();
    return url || FALLBACK_THUMB;
  }

  function getMoveById(id) {
    return state.data.moves.find((move) => String(move.id) === String(id));
  }

  function getPlanById(id) {
    return state.data.plans.find((plan) => String(plan.id) === String(id));
  }

  function getPackById(id) {
    return state.data.packs.find((pack) => String(pack.id) === String(id));
  }

  function getSavedItems() {
    return state.saved
      .map((key) => {
        const [type, id] = String(key).split(":");

        if (type === "move") {
          const item = getMoveById(id);
          return item ? { type, item } : null;
        }

        if (type === "plan") {
          const item = getPlanById(id);
          return item ? { type, item } : null;
        }

        if (type === "pack") {
          const item = getPackById(id);
          return item ? { type, item } : null;
        }

        return null;
      })
      .filter(Boolean);
  }

  function renderHeader() {
    const isPackView = state.view === "pack";

    return `
      <header class="sm-pro-header">
        <div class="sm-pro-header__left">
          <button class="sm-pro-back" type="button" aria-label="Back" data-action="${isPackView ? "back-to-library" : "back"}">
            <span>‹</span>
          </button>

          <div>
            <div class="sm-pro-title-row">
              <h1>${isPackView ? "Journey Pack" : "Pro Library"}</h1>
              <span class="sm-pro-badge">PRO</span>
            </div>
            <p>${isPackView ? "A ready-to-use shooting workflow." : "Moves, plans and packs for your shoot."}</p>
          </div>
        </div>

        <button class="sm-pro-bookmark" type="button" aria-label="Saved" data-tab-jump="saved">
          <span></span>
        </button>
      </header>
    `;
  }

  function renderFiltersButton() {
    return `
      <button class="sm-pro-filter-button" type="button" data-action="open-filters">
        <span class="sm-pro-filter-icon">⌘</span>
        <span>Filters</span>
        <span class="sm-pro-filter-arrow">›</span>
      </button>
    `;
  }

  function renderTabs() {
    const tabs = [
      { id: "all", label: "All" },
      { id: "moves", label: "Moves" },
      { id: "plans", label: "Plans" },
      { id: "packs", label: "Packs" },
      { id: "saved", label: "Saved" }
    ];

    return `
      <nav class="sm-pro-tabs" aria-label="Library tabs">
        ${tabs.map((tab) => `
          <button
            class="sm-pro-tab ${state.activeTab === tab.id ? "is-active" : ""}"
            type="button"
            data-tab="${escapeHtml(tab.id)}"
          >
            ${escapeHtml(tab.label)}
          </button>
        `).join("")}
      </nav>
    `;
  }

  function renderSectionHeader(title, action = "View all") {
    return `
      <div class="sm-pro-section-head">
        <h2>${escapeHtml(title)}</h2>
        <button type="button">${escapeHtml(action)}</button>
      </div>
    `;
  }

  function renderFeaturedPack() {
    const pack = state.data.packs[0];

    if (!pack) return "";

    const bestFor = Array.isArray(pack.bestFor) ? pack.bestFor.join(", ") : "";
    const saved = isSaved("pack", pack.id);

    return `
      <section class="sm-pro-section sm-pro-featured-pack">
        ${renderSectionHeader("Featured pack")}

        <article class="sm-pack-hero" data-pack-id="${escapeHtml(pack.id)}" data-action="open-pack">
          <img src="${getImageUrl(pack.cover)}" alt="${escapeHtml(pack.title)}" loading="lazy" />

          <div class="sm-pack-hero__overlay"></div>

          <div class="sm-pack-hero__top">
            <span class="sm-pill sm-pill--purple">${escapeHtml(pack.badge || "PRO PACK")}</span>
            <button class="sm-card-save ${saved ? "is-saved" : ""}" type="button" aria-label="Save pack" data-save-type="pack" data-save-id="${escapeHtml(pack.id)}"></button>
          </div>

          <div class="sm-pack-hero__content">
            <h3>${escapeHtml(pack.title)}</h3>

            <div class="sm-pack-hero__meta">
              <span>${Number(pack.movesCount || 0)} moves</span>
              <span>${Number(pack.plansCount || 0)} plans</span>
              <span>Pro tips</span>
            </div>

            ${bestFor ? `<p>Best for: ${escapeHtml(bestFor)}</p>` : ""}
          </div>
        </article>
      </section>
    `;
  }

  function renderMoveCard(move) {
    const duration = formatSeconds(move.duration_s);
    const difficulty = getDifficultyLabel(move.difficulty);
    const difficultyClass = getDifficultyClass(move.difficulty);
    const saved = isSaved("move", move.id);

    return `
      <article class="sm-move-card" data-move-id="${escapeHtml(move.id)}" data-action="open-move">
        <img src="${getImageUrl(move.thumb)}" alt="${escapeHtml(move.title)}" loading="lazy" />

        <div class="sm-move-card__shade"></div>

        <div class="sm-move-card__top">
          ${duration ? `<span class="sm-duration">${escapeHtml(duration)}</span>` : ""}
          <button class="sm-card-save ${saved ? "is-saved" : ""}" type="button" aria-label="Save move" data-save-type="move" data-save-id="${escapeHtml(move.id)}"></button>
        </div>

        <button class="sm-play-button" type="button" aria-label="Play ${escapeHtml(move.title)}">
          <span></span>
        </button>

        <div class="sm-move-card__bottom">
          <h3>${escapeHtml(move.title)}</h3>
          <span class="sm-difficulty ${difficultyClass}">
            ${escapeHtml(difficulty)}
          </span>
        </div>
      </article>
    `;
  }

  function renderPlanCard(plan) {
    const duration = formatSeconds(plan.final_clip_duration_s);
    const difficulty = getDifficultyLabel(plan.difficulty);
    const saved = isSaved("plan", plan.id);

    return `
      <article class="sm-plan-card" data-plan-id="${escapeHtml(plan.id)}" data-action="open-plan">
        <img src="${getImageUrl(plan.thumb)}" alt="${escapeHtml(plan.title)}" loading="lazy" />

        <div class="sm-plan-card__shade"></div>

        <div class="sm-plan-card__top">
          ${duration ? `<span class="sm-duration">${escapeHtml(duration)}</span>` : ""}
          <span class="sm-pill sm-pill--soft">${Number(plan.shots_count || 0)} shots</span>
          <span class="sm-pill sm-pill--purple">Plan</span>
          <button class="sm-card-save ${saved ? "is-saved" : ""}" type="button" aria-label="Save plan" data-save-type="plan" data-save-id="${escapeHtml(plan.id)}"></button>
        </div>

        <div class="sm-plan-card__bottom">
          <h3>${escapeHtml(plan.title)}</h3>
          <p>${Number(plan.shoot_time_min || 0)} min shoot • ${escapeHtml(difficulty)}</p>
        </div>
      </article>
    `;
  }

  function renderPopularMoves(moves = state.data.moves.slice(0, 4)) {
    if (!moves.length) return "";

    return `
      <section class="sm-pro-section">
        ${renderSectionHeader("Popular moves")}
        <div class="sm-move-grid">
          ${moves.map(renderMoveCard).join("")}
        </div>
      </section>
    `;
  }

  function renderPlans(plans = state.data.plans.slice(0, 2)) {
    if (!plans.length) return "";

    return `
      <section class="sm-pro-section">
        ${renderSectionHeader("Cinematic plans")}
        <div class="sm-plan-grid">
          ${plans.map(renderPlanCard).join("")}
        </div>
      </section>
    `;
  }

  function renderPacksList(always = false) {
    if (!always && state.activeTab !== "packs") return "";

    const packs = state.data.packs;

    if (!packs.length) return "";

    return `
      <section class="sm-pro-section">
        ${renderSectionHeader("Available packs", "View all")}
        <div class="sm-pack-list">
          ${packs.map((pack) => {
            const saved = isSaved("pack", pack.id);

            return `
              <article class="sm-pack-row" data-pack-id="${escapeHtml(pack.id)}" data-action="open-pack">
                <img src="${getImageUrl(pack.cover)}" alt="${escapeHtml(pack.title)}" loading="lazy" />
                <div>
                  <div class="sm-pack-row__top">
                    <span class="sm-pill sm-pill--purple">${escapeHtml(pack.badge || "PRO PACK")}</span>
                    <button class="sm-card-save ${saved ? "is-saved" : ""}" type="button" aria-label="Save pack" data-save-type="pack" data-save-id="${escapeHtml(pack.id)}"></button>
                  </div>
                  <h3>${escapeHtml(pack.title)}</h3>
                  <p>${escapeHtml(pack.description || "")}</p>
                </div>
              </article>
            `;
          }).join("")}
        </div>
      </section>
    `;
  }

  function renderSavedItems() {
    if (state.activeTab !== "saved") return "";

    const savedItems = getSavedItems();

    if (!savedItems.length) {
      return `
        <section class="sm-pro-section">
          <div class="sm-empty-state">
            <h2>No saved items yet</h2>
            <p>Saved moves, plans and packs will appear here.</p>
          </div>
        </section>
      `;
    }

    const moves = savedItems.filter((entry) => entry.type === "move").map((entry) => entry.item);
    const plans = savedItems.filter((entry) => entry.type === "plan").map((entry) => entry.item);
    const packs = savedItems.filter((entry) => entry.type === "pack").map((entry) => entry.item);

    return `
      ${moves.length ? renderPopularMoves(moves) : ""}
      ${plans.length ? renderPlans(plans) : ""}
      ${packs.length ? renderSavedPacks(packs) : ""}
    `;
  }

  function renderSavedPacks(packs) {
    return `
      <section class="sm-pro-section">
        ${renderSectionHeader("Saved packs", "View all")}
        <div class="sm-pack-list">
          ${packs.map((pack) => `
            <article class="sm-pack-row" data-pack-id="${escapeHtml(pack.id)}" data-action="open-pack">
              <img src="${getImageUrl(pack.cover)}" alt="${escapeHtml(pack.title)}" loading="lazy" />
              <div>
                <div class="sm-pack-row__top">
                  <span class="sm-pill sm-pill--purple">${escapeHtml(pack.badge || "PRO PACK")}</span>
                  <button class="sm-card-save is-saved" type="button" aria-label="Unsave pack" data-save-type="pack" data-save-id="${escapeHtml(pack.id)}"></button>
                </div>
                <h3>${escapeHtml(pack.title)}</h3>
                <p>${escapeHtml(pack.description || "")}</p>
              </div>
            </article>
          `).join("")}
        </div>
      </section>
    `;
  }

  function renderPackDetail() {
    const pack = getPackById(state.activePackId);

    if (!pack) {
      state.view = "library";
      state.activePackId = null;
      return renderLibraryView();
    }

    const moves = state.data.moves.filter((move) => Array.isArray(pack.moveIds) && pack.moveIds.includes(move.id));
    const plans = state.data.plans.filter((plan) => Array.isArray(pack.planIds) && pack.planIds.includes(plan.id));
    const bestFor = Array.isArray(pack.bestFor) ? pack.bestFor.join(", ") : "";
    const checklist = Array.isArray(pack.checklist) ? pack.checklist : [];
    const saved = isSaved("pack", pack.id);

    return `
      <div class="sm-pro-app">
        ${renderHeader()}

        <main class="sm-pro-main">
          <section class="sm-pro-section">
            <article class="sm-pack-detail-hero">
              <img src="${getImageUrl(pack.cover)}" alt="${escapeHtml(pack.title)}" loading="lazy" />
              <div class="sm-pack-detail-hero__shade"></div>

              <div class="sm-pack-detail-hero__top">
                <span class="sm-pill sm-pill--purple">${escapeHtml(pack.badge || "PRO PACK")}</span>
                <button class="sm-card-save ${saved ? "is-saved" : ""}" type="button" aria-label="Save pack" data-save-type="pack" data-save-id="${escapeHtml(pack.id)}"></button>
              </div>

              <div class="sm-pack-detail-hero__content">
                <h2>${escapeHtml(pack.title)}</h2>
                <p>${escapeHtml(pack.description || "")}</p>

                <div class="sm-pack-hero__meta">
                  <span>${Number(pack.movesCount || moves.length || 0)} moves</span>
                  <span>${Number(pack.plansCount || plans.length || 0)} plans</span>
                  <span>${Number(pack.tipsCount || 0)} Pro tips</span>
                </div>

                ${bestFor ? `<p class="sm-pack-best">Best for: ${escapeHtml(bestFor)}</p>` : ""}
              </div>
            </article>
          </section>

          <section class="sm-pro-section">
            ${renderSectionHeader("Creator checklist", "")}
            <div class="sm-checklist">
              ${checklist.map((item, index) => `
                <div class="sm-checklist-item">
                  <span>${index + 1}</span>
                  <p>${escapeHtml(item)}</p>
                </div>
              `).join("")}
            </div>
          </section>

          ${moves.length ? renderPopularMoves(moves) : ""}
          ${plans.length ? renderPlans(plans) : ""}
        </main>
      </div>

      ${renderModal()}
    `;
  }

  function renderLibraryView() {
    return `
      <div class="sm-pro-app">
        ${renderHeader()}
        ${renderFiltersButton()}
        ${renderTabs()}

        <main class="sm-pro-main">
          ${state.activeTab === "all" || state.activeTab === "packs" ? renderFeaturedPack() : ""}
          ${state.activeTab === "all" || state.activeTab === "moves" ? renderPopularMoves() : ""}
          ${state.activeTab === "all" || state.activeTab === "plans" ? renderPlans() : ""}
          ${renderPacksList()}
          ${renderSavedItems()}
        </main>
      </div>

      ${renderModal()}
    `;
  }

  function renderModal() {
    if (!state.modal) return "";

    const { type, id } = state.modal;

    if (type === "move") {
      const move = getMoveById(id);
      if (!move) return "";

      const duration = formatSeconds(move.duration_s);
      const difficulty = getDifficultyLabel(move.difficulty);
      const saved = isSaved("move", move.id);

      return `
        <div class="sm-pro-modal" data-action="close-modal">
          <div class="sm-pro-modal__dialog" data-modal-dialog>
            <button class="sm-pro-modal__close" type="button" data-action="close-modal">×</button>

            <img class="sm-pro-modal__image" src="${getImageUrl(move.thumb)}" alt="${escapeHtml(move.title)}" />

            <div class="sm-pro-modal__body">
              <div class="sm-pro-modal__topline">
                ${duration ? `<span class="sm-duration">${escapeHtml(duration)}</span>` : ""}
                <span class="sm-difficulty ${getDifficultyClass(move.difficulty)}">${escapeHtml(difficulty)}</span>
              </div>

              <h2>${escapeHtml(move.title)}</h2>
              <p>This move preview is ready. Full video player will be connected in the next step.</p>

              <div class="sm-pro-modal__actions">
                <button type="button" class="sm-primary-button">Play move</button>
                <button type="button" class="sm-secondary-button ${saved ? "is-saved" : ""}" data-save-type="move" data-save-id="${escapeHtml(move.id)}">
                  ${saved ? "Saved" : "Save"}
                </button>
              </div>
            </div>
          </div>
        </div>
      `;
    }

    if (type === "plan") {
      const plan = getPlanById(id);
      if (!plan) return "";

      const saved = isSaved("plan", plan.id);

      return `
        <div class="sm-pro-modal" data-action="close-modal">
          <div class="sm-pro-modal__dialog" data-modal-dialog>
            <button class="sm-pro-modal__close" type="button" data-action="close-modal">×</button>

            <img class="sm-pro-modal__image" src="${getImageUrl(plan.thumb)}" alt="${escapeHtml(plan.title)}" />

            <div class="sm-pro-modal__body">
              <div class="sm-pro-modal__topline">
                <span class="sm-duration">${escapeHtml(formatSeconds(plan.final_clip_duration_s))}</span>
                <span class="sm-pill sm-pill--purple">Plan</span>
              </div>

              <h2>${escapeHtml(plan.title)}</h2>
              <p>${escapeHtml(plan.description || "Cinematic plan preview is ready.")}</p>

              <div class="sm-pro-modal__actions">
                <button type="button" class="sm-primary-button">Open plan</button>
                <button type="button" class="sm-secondary-button ${saved ? "is-saved" : ""}" data-save-type="plan" data-save-id="${escapeHtml(plan.id)}">
                  ${saved ? "Saved" : "Save"}
                </button>
              </div>
            </div>
          </div>
        </div>
      `;
    }

    return "";
  }

  function renderApp() {
    root.innerHTML = state.view === "pack" ? renderPackDetail() : renderLibraryView();
    bindEvents();
  }

  function bindEvents() {
    root.querySelectorAll("[data-tab]").forEach((button) => {
      button.addEventListener("click", () => {
        state.activeTab = button.dataset.tab || "all";
        state.view = "library";
        state.modal = null;
        renderApp();
      });
    });

    root.querySelectorAll("[data-tab-jump]").forEach((button) => {
      button.addEventListener("click", () => {
        state.activeTab = button.dataset.tabJump || "saved";
        state.view = "library";
        state.modal = null;
        renderApp();
      });
    });

    root.querySelectorAll("[data-action='back-to-library']").forEach((button) => {
      button.addEventListener("click", () => {
        state.view = "library";
        state.activePackId = null;
        state.modal = null;
        renderApp();
      });
    });

    root.querySelectorAll("[data-action='open-filters']").forEach((button) => {
      button.addEventListener("click", () => {
        console.log("[SM PRO] Filters clicked — Shoot Builder will be added in v0.3");
      });
    });

    root.querySelectorAll("[data-action='open-pack']").forEach((card) => {
      card.addEventListener("click", () => {
        state.view = "pack";
        state.activePackId = card.dataset.packId;
        state.modal = null;
        renderApp();
        window.scrollTo({ top: 0, behavior: "smooth" });
      });
    });

    root.querySelectorAll("[data-action='open-move']").forEach((card) => {
      card.addEventListener("click", () => {
        state.modal = {
          type: "move",
          id: card.dataset.moveId
        };
        renderApp();
      });
    });

    root.querySelectorAll("[data-action='open-plan']").forEach((card) => {
      card.addEventListener("click", () => {
        state.modal = {
          type: "plan",
          id: card.dataset.planId
        };
        renderApp();
      });
    });

    root.querySelectorAll("[data-action='close-modal']").forEach((element) => {
      element.addEventListener("click", (event) => {
        if (event.target.closest("[data-modal-dialog]") && !event.target.matches(".sm-pro-modal__close")) return;
        state.modal = null;
        renderApp();
      });
    });

    root.querySelectorAll("[data-save-type][data-save-id]").forEach((button) => {
      button.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();

        const type = button.dataset.saveType;
        const id = button.dataset.saveId;

        if (!type || !id) return;

        toggleSaved(type, id);
      });
    });
  }

  async function loadData() {
    try {
      root.innerHTML = `
        <div class="sm-pro-loading">
          <div></div>
          <p>Loading Pro Library...</p>
        </div>
      `;

      const response = await fetch(DATA_URL, { cache: "no-store" });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      state.data = {
        moves: Array.isArray(data.moves) ? data.moves : [],
        plans: Array.isArray(data.plans) ? data.plans : [],
        packs: Array.isArray(data.packs) ? data.packs : []
      };

      renderApp();
    } catch (error) {
      console.error("[SM PRO] Failed to load data:", error);

      root.innerHTML = `
        <div class="sm-pro-error">
          <h1>Failed to load Pro Library</h1>
          <p>Check library-data-pro.json and local server.</p>
        </div>
      `;
    }
  }

  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && state.modal) {
      state.modal = null;
      renderApp();
    }
  });

  loadData();
})();