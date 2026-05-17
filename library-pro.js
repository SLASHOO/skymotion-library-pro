(() => {
  "use strict";

  if (window.__SM_LIBRARY_PRO_V03__) return;
  window.__SM_LIBRARY_PRO_V03__ = true;

  const DATA_URL = window.SM_LIBRARY_DATA_URL || "./library-data-pro.json";
  const FALLBACK_THUMB = "https://skymotion-cdn.b-cdn.net/thumb.jpg";
  const API_BASE = String(window.SM_API_BASE || "http://127.0.0.1:8000").replace(/\/$/, "");
  const DEV_MEMBERSTACK_ID = "test_user_123";

  const root = document.getElementById("sm-library-pro");

  if (!root) {
    console.error("[SM PRO] Missing #sm-library-pro root");
    return;
  }

  const proSteps = [
    {
      key: "env",
      text: "Where are you flying?",
      help: "Choose the place that feels closest to your real location.",
      type: "visual",
      options: [
        { label: "Mountains", value: "mountains", image: "https://skymotion-cdn.b-cdn.net/thumbs/hike_plan_test.jpg" },
        { label: "City / Urban", value: "urban", image: "https://skymotion-cdn.b-cdn.net/thumbs/top_down.png" },
        { label: "Forest", value: "forest", image: "https://skymotion-cdn.b-cdn.net/thumbs/raise_up.png" },
        { label: "Open landscape", value: "open", image: "https://skymotion-cdn.b-cdn.net/thumbs/Coastline.jpg" },
        { label: "Beach / Coast", value: "beach", image: "https://skymotion-cdn.b-cdn.net/thumbs/Coastline.jpg" },
        { label: "Near objects", value: "near_objects", image: "https://skymotion-cdn.b-cdn.net/thumbs/orbit.png" }
      ]
    },
    {
      key: "time",
      text: "How much time do you have on location?",
      help: "This helps SkyMotion avoid showing shoots that are too long.",
      type: "buttons",
      options: [
        { label: "5 min", value: "5min" },
        { label: "10 min", value: "10min" },
        { label: "20 min", value: "20min" },
        { label: "Full shoot", value: "full_shoot" }
      ]
    },
    {
      key: "subject",
      text: "What are you filming?",
      help: "Pick the main thing you want to make look cinematic.",
      type: "visual",
      options: [
        { label: "Person", value: "person", image: "https://skymotion-cdn.b-cdn.net/thumbs/orbit.png" },
        { label: "Car / Bike", value: "car_bike", image: "https://skymotion-cdn.b-cdn.net/thumbs/top_down.png" },
        { label: "Building", value: "building", image: "https://skymotion-cdn.b-cdn.net/thumbs/push_out.png" },
        { label: "Landscape", value: "landscape", image: "https://skymotion-cdn.b-cdn.net/thumbs/Coastline.jpg" },
        { label: "Atmosphere", value: "atmosphere", image: "https://skymotion-cdn.b-cdn.net/thumbs/take_off.png" },
        { label: "Water / Coast", value: "water", image: "https://skymotion-cdn.b-cdn.net/thumbs/Coastline.jpg" }
      ]
    },
    {
      key: "moveType",
      text: "What type of moves do you want?",
      help: "Choose simple moves if you need safe and fast ideas.",
      type: "buttons",
      options: [
        { label: "Simple moves", value: "simple" },
        { label: "Advanced moves", value: "advanced" },
        { label: "Mixed difficulty", value: "mixed" }
      ]
    },
    {
      key: "pilot",
      text: "How confident are you right now?",
      help: "This is about today's location, not your general skill level.",
      type: "buttons",
      options: [
        { label: "Playing safe", value: "safe" },
        { label: "Normal", value: "normal" },
        { label: "Ready to experiment", value: "experiment" }
      ]
    },
    {
      key: "mood",
      text: "What vibe do you want?",
      help: "This changes the style of the recommended moves and plans.",
      type: "buttons",
      options: [
        { label: "Smooth", value: "smooth" },
        { label: "Epic", value: "epic" },
        { label: "Dynamic", value: "dynamic" },
        { label: "Tense", value: "tense" },
        { label: "Wow", value: "wow" }
      ]
    }
  ];

  const state = {
    data: {
      moves: [],
      plans: [],
      packs: []
    },
    activeTab: "all",
    view: "library",
    activePackId: null,
    lockedPackId: null,
    modal: null,
    saved: [],
    access: {
      isPro: false,
      ownedPacks: []
    },
    isBackendReady: false,
    filters: {},
    filterStepIndex: 0,
    filterHistory: []
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
  async function getMemberstackId() {
  try {
    const memberstack = window.$memberstackDom;

    if (memberstack && typeof memberstack.getCurrentMember === "function") {
      const result = await memberstack.getCurrentMember();
      const member = result?.data || result;

      if (member?.id) return member.id;
    }
  } catch (error) {
    console.warn("[SM PRO] Memberstack user not available:", error);
  }

  return DEV_MEMBERSTACK_ID;
}

async function apiRequest(path, options = {}) {
  const memberstackId = await getMemberstackId();

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "x-ms-id": memberstackId,
      ...(options.headers || {})
    }
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`API ${response.status}: ${text || response.statusText}`);
  }

  if (response.status === 204) return null;

  return response.json();
}

async function hydrateAccess() {
  try {
    const data = await apiRequest("/v1/me/access");

    state.access = {
      isPro: Boolean(data?.is_pro),
      ownedPacks: Array.isArray(data?.owned_packs) ? data.owned_packs : []
    };
  } catch (error) {
    console.warn("[SM PRO] Failed to hydrate access:", error);

    state.access = {
      isPro: false,
      ownedPacks: []
    };
  }
}

async function hydrateSavedItems() {
  try {
    const data = await apiRequest("/v1/saved-items");
    const items = Array.isArray(data?.items) ? data.items : [];

    state.saved = items.map((item) => {
      return getSavedKey(item.item_type, item.item_id);
    });
  } catch (error) {
    console.warn("[SM PRO] Failed to hydrate saved items:", error);
    state.saved = [];
  }
}
  function getSavedKey(type, id) {
    return `${type}:${id}`;
  }

  function isSaved(type, id) {
    return state.saved.includes(getSavedKey(type, id));
  }

  async function toggleSaved(type, id) {
  const key = getSavedKey(type, id);
  const wasSaved = state.saved.includes(key);

  if (wasSaved) {
    state.saved = state.saved.filter((item) => item !== key);
  } else {
    state.saved.push(key);
  }

  renderApp();

  try {
    if (wasSaved) {
      await apiRequest(`/v1/saved-items/${encodeURIComponent(type)}/${encodeURIComponent(id)}`, {
        method: "DELETE"
      });
    } else {
      await apiRequest("/v1/saved-items", {
        method: "POST",
        body: JSON.stringify({
          item_type: type,
          item_id: id
        })
      });
    }

    await hydrateSavedItems();
    renderApp();
  } catch (error) {
    console.error("[SM PRO] Failed to toggle saved item:", error);

    if (wasSaved) {
      state.saved.push(key);
    } else {
      state.saved = state.saved.filter((item) => item !== key);
    }

    renderApp();
  }
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
  function userCanAccessPack(packId) {
  if (state.access.isPro) return true;

  return Array.isArray(state.access.ownedPacks) &&
    state.access.ownedPacks.includes(packId);
}

  function arrayHas(value, selected) {
    if (!selected) return true;
    if (selected === "full_shoot") return true;

    const arr = Array.isArray(value) ? value : [];
    return arr.map(String).includes(String(selected));
  }

  function itemMatchesFilters(item) {
    const f = state.filters;

    return (
      arrayHas(item.env, f.env) &&
      arrayHas(item.time, f.time) &&
      arrayHas(item.subject, f.subject) &&
      arrayHas(item.moveType, f.moveType) &&
      arrayHas(item.pilot, f.pilot) &&
      arrayHas(item.mood, f.mood)
    );
  }

  function planMatchesFilters(plan) {
    const f = state.filters;

    return (
      arrayHas(plan.env, f.env) &&
      arrayHas(plan.subject, f.subject) &&
      arrayHas(plan.mood, f.mood)
    );
  }

  function getFilteredMoves() {
    return state.data.moves.filter(itemMatchesFilters);
  }

  function getFilteredPlans() {
    return state.data.plans.filter(planMatchesFilters);
  }

  function getFilteredPacks() {
    const moves = getFilteredMoves();
    const plans = getFilteredPlans();

    const moveIds = new Set(moves.map((move) => move.id));
    const planIds = new Set(plans.map((plan) => plan.id));

    return state.data.packs.filter((pack) => {
      const packMoveIds = Array.isArray(pack.moveIds) ? pack.moveIds : [];
      const packPlanIds = Array.isArray(pack.planIds) ? pack.planIds : [];

      return (
        packMoveIds.some((id) => moveIds.has(id)) ||
        packPlanIds.some((id) => planIds.has(id)) ||
        Object.keys(state.filters).length === 0
      );
    });
  }

  function getMatchSummary() {
    return {
      moves: getFilteredMoves().length,
      plans: getFilteredPlans().length,
      packs: getFilteredPacks().length
    };
  }

  function hasActiveFilters() {
    return Object.keys(state.filters).some((key) => state.filters[key]);
  }

  function getStepByKey(key) {
    return proSteps.find((step) => step.key === key);
  }

  function getOptionLabel(stepKey, value) {
    const step = getStepByKey(stepKey);
    const option = step?.options?.find((item) => item.value === value);
    return option?.label || value;
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
    const isFiltersView = state.view === "filters";

    return `
      <header class="sm-pro-header">
        <div class="sm-pro-header__left">
          <button class="sm-pro-back" type="button" aria-label="Back" data-action="${isPackView || isFiltersView ? "back-to-library" : "back"}">
            <span>‹</span>
          </button>

          <div>
            <div class="sm-pro-title-row">
              <h1>${isPackView ? "Journey Pack" : isFiltersView ? "Shoot Builder" : "Pro Library"}</h1>
              <span class="sm-pro-badge">PRO</span>
            </div>
            <p>${isPackView ? "A ready-to-use shooting workflow." : isFiltersView ? "Build a shoot based on your location." : "Moves, plans and packs for your shoot."}</p>
          </div>
        </div>

        <button class="sm-pro-bookmark" type="button" aria-label="Saved" data-tab-jump="saved">
          <span></span>
        </button>
      </header>
    `;
  }

  function renderFiltersButton() {
    const summary = getMatchSummary();

    return `
      <button class="sm-pro-filter-button" type="button" data-action="open-filters">
        <span class="sm-pro-filter-icon">⌘</span>
        <span>${hasActiveFilters() ? `${summary.moves} moves · ${summary.plans} plans · ${summary.packs} pack` : "Filters"}</span>
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
        ${action ? `<button type="button">${escapeHtml(action)}</button>` : ""}
      </div>
    `;
  }

  function renderActiveFilters() {
    if (!hasActiveFilters()) return "";

    const entries = Object.entries(state.filters).filter(([, value]) => value);

    return `
      <div class="sm-active-filters">
        ${entries.map(([key, value]) => `
          <button type="button" data-remove-filter="${escapeHtml(key)}">
            ${escapeHtml(getOptionLabel(key, value))} <span>×</span>
          </button>
        `).join("")}

        <button type="button" class="sm-active-filters__clear" data-action="clear-filters">
          Clear all
        </button>
      </div>
    `;
  }

  function renderFeaturedPack() {
    const pack = getFilteredPacks()[0];

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

  function renderPopularMoves(moves = getFilteredMoves().slice(0, 4)) {
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

  function renderPlans(plans = getFilteredPlans().slice(0, 2)) {
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

    const packs = getFilteredPacks();

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

  function renderNoFilteredResults() {
    if (!hasActiveFilters()) return "";

    const summary = getMatchSummary();
    const total = summary.moves + summary.plans + summary.packs;

    if (total > 0) return "";

    return `
      <section class="sm-pro-section">
        <div class="sm-empty-state">
          <h2>No matching results</h2>
          <p>Try removing one filter or choosing mixed difficulty.</p>
          <button class="sm-primary-button" type="button" data-action="clear-filters">Reset filters</button>
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
    const tips = Array.isArray(pack.tips) ? pack.tips : [];

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
  <div class="sm-pack-intro">
    <span>Pack guide</span>
    <h2>${escapeHtml(pack.introTitle || "Shoot with a ready plan")}</h2>
    <p>${escapeHtml(pack.introText || "Use this pack as a ready-to-use shooting structure.")}</p>

    <div class="sm-pack-structure">
      <div>
        <strong>${Number(pack.movesCount || moves.length || 0)}</strong>
        <span>Moves</span>
      </div>
      <div>
        <strong>${Number(pack.plansCount || plans.length || 0)}</strong>
        <span>Plans</span>
      </div>
      <div>
        <strong>${Number(pack.tipsCount || tips.length || 0)}</strong>
        <span>Pro tips</span>
      </div>
    </div>
  </div>
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
          ${tips.length ? `
  <section class="sm-pro-section">
    ${renderSectionHeader("Pro tips", "")}
    <div class="sm-pro-tips">
      ${tips.map((tip) => `
        <div class="sm-pro-tip">
          <span>✦</span>
          <p>${escapeHtml(tip)}</p>
        </div>
      `).join("")}
    </div>
  </section>
` : ""}

          ${moves.length ? renderPopularMoves(moves) : ""}
          ${plans.length ? renderPlans(plans) : ""}
          <section class="sm-pro-section">
  <div class="sm-pack-cta">
    <h2>${escapeHtml(pack.ctaTitle || "Ready to start?")}</h2>
    <p>${escapeHtml(pack.ctaText || "Use this pack to build your next shoot.")}</p>
    <button class="sm-primary-button" type="button" data-action="open-filters">
      Build shoot from this pack
    </button>
  </div>
</section>
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
        ${renderActiveFilters()}
        ${renderTabs()}

        <main class="sm-pro-main">
          ${renderNoFilteredResults()}
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

  function renderFilterProgress() {
    const progress = Math.max(5, ((state.filterStepIndex) / proSteps.length) * 100);

    return `
      <div class="sm-filter-progress">
        <div style="width:${progress}%"></div>
      </div>
    `;
  }

  function renderFilterSummary() {
    const summary = getMatchSummary();

    return `
      <div class="sm-filter-summary">
        <span>${summary.moves} moves</span>
        <span>${summary.plans} plans</span>
        <span>${summary.packs} pack</span>
      </div>
    `;
  }

  function renderFilterOptions(step) {
    if (step.type === "visual") {
      return `
        <div class="sm-filter-visual-grid">
          ${step.options.map((option) => `
            <button
              type="button"
              class="sm-filter-visual-card ${state.filters[step.key] === option.value ? "is-selected" : ""}"
              data-filter-key="${escapeHtml(step.key)}"
              data-filter-value="${escapeHtml(option.value)}"
            >
              <img src="${getImageUrl(option.image)}" alt="${escapeHtml(option.label)}" loading="lazy" />
              <span>${escapeHtml(option.label)}</span>
            </button>
          `).join("")}
        </div>
      `;
    }

    return `
      <div class="sm-filter-button-grid">
        ${step.options.map((option) => `
          <button
            type="button"
            class="sm-filter-choice ${state.filters[step.key] === option.value ? "is-selected" : ""}"
            data-filter-key="${escapeHtml(step.key)}"
            data-filter-value="${escapeHtml(option.value)}"
          >
            ${escapeHtml(option.label)}
          </button>
        `).join("")}
      </div>
    `;
  }

  function renderFilterView() {
    const step = proSteps[state.filterStepIndex] || proSteps[0];

    return `
      <div class="sm-pro-app">
        ${renderHeader()}

        <main class="sm-pro-filter-view">
          ${renderFilterProgress()}

          <section class="sm-filter-card">
            <div class="sm-filter-card__top">
              <span>Step ${state.filterStepIndex + 1} of ${proSteps.length}</span>
              ${renderFilterSummary()}
            </div>

            <h2>${escapeHtml(step.text)}</h2>
            <p>${escapeHtml(step.help || "")}</p>

            ${renderFilterOptions(step)}
          </section>

          <div class="sm-filter-footer">
            <button class="sm-secondary-button" type="button" data-action="filter-reset">Reset</button>
            <button class="sm-secondary-button" type="button" data-action="filter-prev" ${state.filterHistory.length ? "" : "disabled"}>Previous</button>
            <button class="sm-primary-button" type="button" data-action="filter-show-results">Show results</button>
          </div>
        </main>
      </div>
    `;
  }

  function renderModal() {
    if (!state.modal) return "";

    const { type, id } = state.modal;
    if (type === "locked-pack") {
  const pack = getPackById(id);

  return `
    <div class="sm-pro-modal" data-action="close-modal">
      <div class="sm-pro-modal__dialog" data-modal-dialog>
        <button class="sm-pro-modal__close" type="button" data-action="close-modal">×</button>

        <img class="sm-pro-modal__image" src="${getImageUrl(pack?.cover)}" alt="${escapeHtml(pack?.title || "Pro Pack")}" />

        <div class="sm-pro-modal__body">
          <div class="sm-pro-modal__topline">
            <span class="sm-pill sm-pill--purple">BETA PRO</span>
          </div>

          <h2>${escapeHtml(pack?.title || "Pro Pack")}</h2>
          <p>This pack is part of SkyMotion Pro Beta. Access is free for selected beta users right now. Ask for Pro Beta access to test this pack.</p>

          <div class="sm-pro-modal__actions">
            <button type="button" class="sm-primary-button" data-action="request-beta-access">
              Request Beta Access
            </button>
            <button type="button" class="sm-secondary-button" data-action="close-modal">
              Not now
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
}

    if (type === "move") {
  const move = getMoveById(id);
  if (!move) return "";

  const duration = formatSeconds(move.duration_s);
  const difficulty = getDifficultyLabel(move.difficulty);
  const saved = isSaved("move", move.id);
  const videoUrl = String(move.videoUrl || move.video_url || "").trim();

  return `
    <div class="sm-pro-modal sm-pro-player-modal" data-action="close-modal">
      <div class="sm-pro-player" data-modal-dialog>
        <div class="sm-pro-player__top">
          <div>
            <h2>${escapeHtml(move.title)}</h2>
            <div class="sm-pro-player__meta">
              ${duration ? `<span>${escapeHtml(duration)}</span>` : ""}
              <span>${escapeHtml(difficulty)}</span>
            </div>
          </div>

          <button class="sm-pro-modal__close" type="button" data-action="close-modal">×</button>
        </div>

        <div class="sm-pro-player__video-wrap">
          ${
            videoUrl
              ? `
                <video
                  class="sm-pro-player__video"
                  id="smProPlayerVideo"
                  src="${escapeHtml(videoUrl)}"
                  poster="${getImageUrl(move.thumb)}"
                  controls
                  playsinline
                  preload="metadata"
                ></video>
              `
              : `
                <div class="sm-pro-player__missing">
                  <p>No video URL found for this move.</p>
                </div>
              `
          }
        </div>

        <div class="sm-pro-player__bottom">
          <button type="button" class="sm-primary-button" data-action="play-current-video">
            Play
          </button>

          <button
            type="button"
            class="sm-secondary-button ${saved ? "is-saved" : ""}"
            data-save-type="move"
            data-save-id="${escapeHtml(move.id)}"
          >
            ${saved ? "Saved" : "Save"}
          </button>
        </div>
      </div>
    </div>
  `;
}

    if (type === "plan") {
  const plan = getPlanById(id);
  if (!plan) return "";

  const saved = isSaved("plan", plan.id);
  const steps = Array.isArray(plan.steps) ? plan.steps : [];
  const resultVideo = String(plan.result_video || plan.resultVideo || "").trim();
  const duration = formatSeconds(plan.final_clip_duration_s);
  const difficulty = getDifficultyLabel(plan.difficulty);

  return `
    <div class="sm-pro-modal sm-pro-plan-modal" data-action="close-modal">
      <div class="sm-pro-plan-viewer" data-modal-dialog>
        <div class="sm-pro-plan-viewer__hero">
          ${
            resultVideo
              ? `
                <video
                  class="sm-pro-plan-viewer__video"
                  id="smProPlanVideo"
                  src="${escapeHtml(resultVideo)}"
                  poster="${getImageUrl(plan.thumb)}"
                  playsinline
                  preload="metadata"
                  controls
                ></video>
              `
              : `
                <img
                  class="sm-pro-plan-viewer__video"
                  src="${getImageUrl(plan.thumb)}"
                  alt="${escapeHtml(plan.title)}"
                />
              `
          }

          <div class="sm-pro-plan-viewer__shade"></div>

          <button class="sm-pro-modal__close" type="button" data-action="close-modal">×</button>

          <div class="sm-pro-plan-viewer__hero-content">
            <div class="sm-pro-modal__topline">
              ${duration ? `<span class="sm-duration">${escapeHtml(duration)}</span>` : ""}
              <span class="sm-pill sm-pill--soft">${Number(plan.shots_count || steps.length || 0)} shots</span>
              <span class="sm-pill sm-pill--purple">Plan</span>
            </div>

            <h2>${escapeHtml(plan.title)}</h2>
            <p>${escapeHtml(plan.description || "")}</p>
          </div>
        </div>

        <div class="sm-pro-plan-viewer__body">
          <div class="sm-pro-plan-viewer__stats">
            <div>
              <span>Shoot time</span>
              <strong>${Number(plan.shoot_time_min || 0)} min</strong>
            </div>
            <div>
              <span>Difficulty</span>
              <strong>${escapeHtml(difficulty)}</strong>
            </div>
            <div>
              <span>Shots</span>
              <strong>${Number(plan.shots_count || steps.length || 0)}</strong>
            </div>
          </div>

          <div class="sm-pro-plan-viewer__actions">
            <button type="button" class="sm-primary-button" data-action="play-plan-result">
              Play result
            </button>

            <button
              type="button"
              class="sm-secondary-button ${saved ? "is-saved" : ""}"
              data-save-type="plan"
              data-save-id="${escapeHtml(plan.id)}"
            >
              ${saved ? "Saved" : "Save"}
            </button>
          </div>

          <section class="sm-pro-plan-steps">
            <div class="sm-pro-section-head">
              <h2>Plan steps</h2>
            </div>

            ${steps.map((step, index) => {
              const move = getMoveById(step.move_ref);
              const moveId = move?.id || step.move_ref || "";
              const stepDuration = formatSeconds(step.duration_s);

              return `
                <article class="sm-pro-plan-step">
                  <img src="${getImageUrl(step.thumb || move?.thumb)}" alt="${escapeHtml(step.title)}" loading="lazy" />

                  <div class="sm-pro-plan-step__content">
                    <span>Shot ${index + 1}${stepDuration ? ` · ${escapeHtml(stepDuration)}` : ""}</span>
                    <h3>${escapeHtml(step.title || move?.title || `Shot ${index + 1}`)}</h3>
                    <p>${escapeHtml(step.tip || "Open the related move to see how to shoot it.")}</p>
                  </div>

                  ${
                    moveId
                      ? `
                        <button
                          type="button"
                          class="sm-pro-plan-step__play"
                          data-action="open-step-move"
                          data-move-id="${escapeHtml(moveId)}"
                          aria-label="Open move"
                        >
                          ›
                        </button>
                      `
                      : ""
                  }
                </article>
              `;
            }).join("")}
          </section>
        </div>
      </div>
    </div>
  `;
}

    return "";
  }

  function renderApp() {
    if (state.view === "filters") {
      root.innerHTML = renderFilterView();
    } else if (state.view === "pack") {
      root.innerHTML = renderPackDetail();
    } else {
      root.innerHTML = renderLibraryView();
    }

    bindEvents();
  }

  function chooseFilter(key, value) {
    state.filterHistory.push({
      stepIndex: state.filterStepIndex,
      filters: { ...state.filters }
    });

    state.filters[key] = value;

    if (state.filterStepIndex < proSteps.length - 1) {
      state.filterStepIndex += 1;
    }

    renderApp();
  }

  function resetFilters() {
    state.filters = {};
    state.filterStepIndex = 0;
    state.filterHistory = [];
    renderApp();
  }

  function showResults() {
    state.view = "library";
    state.activeTab = "all";
    state.modal = null;
    renderApp();
    window.scrollTo({ top: 0, behavior: "smooth" });
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
  root.querySelectorAll("[data-action='request-beta-access']").forEach((button) => {
  button.addEventListener("click", () => {
    console.log("[SM PRO] Beta access request clicked.");
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
        state.view = "filters";
        state.modal = null;
        renderApp();
      });
    });

    root.querySelectorAll("[data-filter-key][data-filter-value]").forEach((button) => {
      button.addEventListener("click", () => {
        chooseFilter(button.dataset.filterKey, button.dataset.filterValue);
      });
    });

    root.querySelectorAll("[data-action='filter-prev']").forEach((button) => {
      button.addEventListener("click", () => {
        const last = state.filterHistory.pop();
        if (!last) return;

        state.filterStepIndex = last.stepIndex;
        state.filters = { ...last.filters };
        renderApp();
      });
    });

    root.querySelectorAll("[data-action='filter-reset']").forEach((button) => {
      button.addEventListener("click", resetFilters);
    });

    root.querySelectorAll("[data-action='filter-show-results']").forEach((button) => {
      button.addEventListener("click", showResults);
    });

    root.querySelectorAll("[data-action='clear-filters']").forEach((button) => {
      button.addEventListener("click", () => {
        state.filters = {};
        state.filterStepIndex = 0;
        state.filterHistory = [];
        renderApp();
      });
    });

    root.querySelectorAll("[data-remove-filter]").forEach((button) => {
      button.addEventListener("click", () => {
        const key = button.dataset.removeFilter;
        delete state.filters[key];
        renderApp();
      });
    });

    root.querySelectorAll("[data-action='open-pack']").forEach((card) => {
  card.addEventListener("click", () => {
    const packId = card.dataset.packId;

    if (!userCanAccessPack(packId)) {
      state.lockedPackId = packId;
      state.modal = {
        type: "locked-pack",
        id: packId
      };
      renderApp();
      return;
    }

    state.view = "pack";
    state.activePackId = packId;
    state.lockedPackId = null;
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

    root.querySelectorAll("[data-action='play-current-video']").forEach((button) => {
  button.addEventListener("click", () => {
    const video = root.querySelector("#smProPlayerVideo");
    if (!video) return;

    video.play().catch(() => {});
  });
});

    root.querySelectorAll("[data-action='play-plan-result']").forEach((button) => {
  button.addEventListener("click", () => {
    const video = root.querySelector("#smProPlanVideo");
    if (!video || typeof video.play !== "function") return;

    video.play().catch(() => {});
  });
});

root.querySelectorAll("[data-action='open-step-move']").forEach((button) => {
  button.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();

    const moveId = button.dataset.moveId;
    if (!moveId) return;

    state.modal = {
      type: "move",
      id: moveId
    };

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
      await hydrateAccess();
      await hydrateSavedItems();
      state.isBackendReady = true;
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
