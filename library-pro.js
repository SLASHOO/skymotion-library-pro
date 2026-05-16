(() => {
  "use strict";

  if (window.__SM_LIBRARY_PRO_V01__) return;
  window.__SM_LIBRARY_PRO_V01__ = true;

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
    activeTab: "all"
  };

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

  function getPackById(id) {
    return state.data.packs.find((pack) => String(pack.id) === String(id));
  }

  function renderHeader() {
    return `
      <header class="sm-pro-header">
        <div class="sm-pro-header__left">
          <button class="sm-pro-back" type="button" aria-label="Back">
            <span>‹</span>
          </button>

          <div>
            <div class="sm-pro-title-row">
              <h1>Pro Library</h1>
              <span class="sm-pro-badge">PRO</span>
            </div>
            <p>Moves, plans and packs for your shoot.</p>
          </div>
        </div>

        <button class="sm-pro-bookmark" type="button" aria-label="Saved">
          <span></span>
        </button>
      </header>
    `;
  }

  function renderFiltersButton() {
    return `
      <button class="sm-pro-filter-button" type="button">
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

    return `
      <section class="sm-pro-section sm-pro-featured-pack">
        ${renderSectionHeader("Featured pack")}

        <article class="sm-pack-hero" data-pack-id="${escapeHtml(pack.id)}">
          <img src="${getImageUrl(pack.cover)}" alt="${escapeHtml(pack.title)}" loading="lazy" />

          <div class="sm-pack-hero__overlay"></div>

          <div class="sm-pack-hero__top">
            <span class="sm-pill sm-pill--purple">${escapeHtml(pack.badge || "PRO PACK")}</span>
            <button class="sm-card-save" type="button" aria-label="Save pack"></button>
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

    return `
      <article class="sm-move-card" data-move-id="${escapeHtml(move.id)}">
        <img src="${getImageUrl(move.thumb)}" alt="${escapeHtml(move.title)}" loading="lazy" />

        <div class="sm-move-card__shade"></div>

        <div class="sm-move-card__top">
          ${duration ? `<span class="sm-duration">${escapeHtml(duration)}</span>` : ""}
          <button class="sm-card-save" type="button" aria-label="Save move"></button>
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

    return `
      <article class="sm-plan-card" data-plan-id="${escapeHtml(plan.id)}">
        <img src="${getImageUrl(plan.thumb)}" alt="${escapeHtml(plan.title)}" loading="lazy" />

        <div class="sm-plan-card__shade"></div>

        <div class="sm-plan-card__top">
          ${duration ? `<span class="sm-duration">${escapeHtml(duration)}</span>` : ""}
          <span class="sm-pill sm-pill--soft">${Number(plan.shots_count || 0)} shots</span>
          <span class="sm-pill sm-pill--purple">Plan</span>
          <button class="sm-card-save" type="button" aria-label="Save plan"></button>
        </div>

        <div class="sm-plan-card__bottom">
          <h3>${escapeHtml(plan.title)}</h3>
          <p>${Number(plan.shoot_time_min || 0)} min shoot • ${escapeHtml(difficulty)}</p>
        </div>
      </article>
    `;
  }

  function renderPopularMoves() {
    const moves = state.data.moves.slice(0, 4);

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

  function renderPlans() {
    const plans = state.data.plans.slice(0, 2);

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

  function renderPacksList() {
    if (state.activeTab !== "packs") return "";

    const packs = state.data.packs;

    return `
      <section class="sm-pro-section">
        ${renderSectionHeader("Available packs", "View all")}
        <div class="sm-pack-list">
          ${packs.map((pack) => `
            <article class="sm-pack-row" data-pack-id="${escapeHtml(pack.id)}">
              <img src="${getImageUrl(pack.cover)}" alt="${escapeHtml(pack.title)}" loading="lazy" />
              <div>
                <span class="sm-pill sm-pill--purple">${escapeHtml(pack.badge || "PRO PACK")}</span>
                <h3>${escapeHtml(pack.title)}</h3>
                <p>${escapeHtml(pack.description || "")}</p>
              </div>
            </article>
          `).join("")}
        </div>
      </section>
    `;
  }

  function renderSavedEmpty() {
    if (state.activeTab !== "saved") return "";

    return `
      <section class="sm-pro-section">
        <div class="sm-empty-state">
          <h2>No saved items yet</h2>
          <p>Saved moves, plans and packs will appear here later.</p>
        </div>
      </section>
    `;
  }

  function renderApp() {
    root.innerHTML = `
      <div class="sm-pro-app">
        ${renderHeader()}
        ${renderFiltersButton()}
        ${renderTabs()}

        <main class="sm-pro-main">
          ${state.activeTab === "all" || state.activeTab === "packs" ? renderFeaturedPack() : ""}
          ${state.activeTab === "all" || state.activeTab === "moves" ? renderPopularMoves() : ""}
          ${state.activeTab === "all" || state.activeTab === "plans" ? renderPlans() : ""}
          ${renderPacksList()}
          ${renderSavedEmpty()}
        </main>
      </div>
    `;

    bindEvents();
  }

  function bindEvents() {
    root.querySelectorAll("[data-tab]").forEach((button) => {
      button.addEventListener("click", () => {
        state.activeTab = button.dataset.tab || "all";
        renderApp();
      });
    });

    root.querySelector(".sm-pro-filter-button")?.addEventListener("click", () => {
      console.log("[SM PRO] Filters clicked — Shoot Builder will be added in v0.2");
    });

    root.querySelectorAll(".sm-card-save").forEach((button) => {
      button.addEventListener("click", (event) => {
        event.stopPropagation();
        button.classList.toggle("is-saved");
      });
    });

    root.querySelectorAll(".sm-pack-hero, .sm-pack-row").forEach((card) => {
      card.addEventListener("click", () => {
        const pack = getPackById(card.dataset.packId);
        console.log("[SM PRO] Pack clicked:", pack?.title || card.dataset.packId);
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

  loadData();
})();