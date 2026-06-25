(() => {
  "use strict";
  if (window.__SM_LIBRARY_V1_CLEAN_SPLIT__) return;
  window.__SM_LIBRARY_V1_CLEAN_SPLIT__ = true;


  const FALLBACK_THUMB = "https://skymotion-cdn.b-cdn.net/thumb.jpg";
  const REAL_ESTATE_PACK_COVER = window.SM_REAL_ESTATE_PACK_COVER_URL || "https://skymotion-cdn.b-cdn.net/thumb.jpg";
  const CHECKLIST_PAPER_ASSET_URL = window.SM_CHECKLIST_PAPER_ASSET_URL || "https://skymotion-cdn.b-cdn.net/checklist.png";
  const CDN_INDEX_URL = "https://skymotion-cdn.b-cdn.net/videos_index_v16.json";
  const API_BASE = String(window.SM_API_BASE || "https://skymotion.onrender.com").replace(/\/$/, "");
  const $ = (id) => document.getElementById(id);

  const scope = $("sm-library-scope");
  if (!scope) return;

  function setPackDetailPageMode(enabled) {
    const on = !!enabled;
    document.documentElement.classList.toggle("sm-pack-detail-open", on);
    document.body.classList.toggle("sm-pack-detail-open", on);

    const setImp = (el, prop, value) => {
      if (!el) return;
      el.style.setProperty(prop, value, "important");
    };

    const clear = (el, props) => {
      if (!el) return;
      props.forEach((prop) => el.style.removeProperty(prop));
    };

    const pageEls = [
      document.documentElement,
      document.body
    ];

    const packEls = [
      scope,
      scope?.querySelector(".library"),
      scope?.querySelector(".results"),
      scope?.querySelector(".results__grid")
    ];

    if (on) {
      pageEls.forEach((el) => {
        setImp(el, "height", "auto");
        setImp(el, "min-height", "100%");
        setImp(el, "max-height", "none");
        setImp(el, "overflow", "auto");
        setImp(el, "overflow-x", "hidden");
        setImp(el, "overflow-y", "auto");
        setImp(el, "position", "static");
      });

      packEls.forEach((el) => {
        setImp(el, "height", "auto");
        setImp(el, "max-height", "none");
        setImp(el, "overflow", "visible");
      });

      if (scope) {
        setImp(scope, "min-height", "100vh");
        setImp(scope, "overflow-x", "hidden");
        setImp(scope, "overflow-y", "visible");
      }
    } else {
      pageEls.forEach((el) => clear(el, ["height", "min-height", "max-height", "overflow", "overflow-x", "overflow-y", "position"]));
      packEls.forEach((el) => clear(el, ["height", "min-height", "max-height", "overflow", "overflow-x", "overflow-y"]));
    }
  }

  function emit(name, detail = {}) {
    window.dispatchEvent(new CustomEvent(name, { detail }));
  }

  let libraryViewedSent = false;

  const openAssistantBtn = $("openAssistantBtn");
  const closeAssistantBtn = $("closeAssistantBtn");
  const assistantBackdropEl = $("assistantBackdrop");
  const assistant = scope.querySelector(".assistant");

  const chat = $("chat");
  const grid = $("resultsGrid");
  const matchCount = $("matchCount");
  const resetBtn = $("resetBtn");
  const backBtn = $("backBtn");
  const showResultsBtn = $("showResultsBtn");
  let mobileShowResultsBtn = null;
  const filterProgressBar = $("filterProgressBar");
  const backToResultsBtn = $("backToResultsBtn");
  const moreBtn = $("moreBtn");
  const resultsHead = $("resultsHead");

  const modal = $("modal");
  const modalBackdrop = $("modalBackdrop");
  const modalContent = $("modalContent");

  const required = { assistant, chat, grid, matchCount, resetBtn, modal, modalBackdrop, modalContent };

  const missing = Object.entries(required).filter(([, el]) => !el).map(([name]) => name);
  if (missing.length) {
    console.warn("[SM] Missing required elements:", missing);
    return;
  }

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  function setPlayerViewportHeight() {
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty("--sm-player-vh", `${vh}px`);
  }

  function escapeHtml(str) {
    return String(str ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function formatPlayerTime(sec) {
    const n = Number(sec || 0);
    if (!Number.isFinite(n) || n < 0) return "0:00";
    const m = Math.floor(n / 60);
    const s = Math.floor(n % 60);
    return `${m}:${String(s).padStart(2, "0")}`;
  }

  function safeText(el, t) {
    if (el) el.textContent = String(t ?? "");
  }

  function isPlan(x) {
    return String(x?.kind || "").toLowerCase() === "plan";
  }

  function normalizeUrl(u) {
    const s = String(u ?? "").trim();
    return s ? s : "";
  }

  function pickThumb(...candidates) {
    for (const c of candidates) {
      const u = normalizeUrl(c);
      if (u) return u;
    }
    return FALLBACK_THUMB;
  }

  function formatSeconds(sec) {
    const n = Number(sec || 0);
    if (!Number.isFinite(n) || n <= 0) return "";
    const m = Math.floor(n / 60);
    const s = Math.floor(n % 60);
    return m > 0 ? `${m}:${String(s).padStart(2, "0")}` : `0:${String(s).padStart(2, "0")}`;
  }

  function attachImgFallback(root) {
    if (!root) return;

    root.querySelectorAll("img").forEach((img) => {
      const hasSrc = normalizeUrl(img.getAttribute("src"));
      if (!hasSrc) img.src = FALLBACK_THUMB;

      img.addEventListener("error", () => {
        if (img.dataset.smFallbackApplied === "1") return;
        img.dataset.smFallbackApplied = "1";
        img.src = FALLBACK_THUMB;
      }, { once: true });
    });
  }

  function getVideoId(v) {
    return v?.id || v?.slug || v?.videoUrl || v?.video_url || ((v?.title || "") + "|" + (v?.duration || ""));
  }

  function hasMatch(itemValue, selectedValue) {
    if (!selectedValue) return true;
    const arr = Array.isArray(itemValue) ? itemValue.map((x) => String(x).toLowerCase()) : [];
    return arr.includes(String(selectedValue).toLowerCase());
  }

  function normalizeFilterValue(stepKey, label) {
    if (!label) return "";

    const map = {
      env: {
        "Mountains": "open",
        "City / Urban": "urban",
        "Forest": "forest",
        "Open landscape": "open",
        "Beach / Coast": "open",
        "Near objects": "near_objects",
        "Open area": "open",
        "Tight space": "tight_space"
      },
      risk: {
        "Very safe": "calm",
        "Some risks": "some_risks",
        "Wind / difficult conditions": "some_risks",
        "Crowded / limited control": "some_risks",
        "Safe & calm": "calm",
        "No aggressive moves": "no_aggressive_moves"
      },
      subject: {
        "Person": "person",
        "Car / Bike": "car_bike",
        "Building": "building",
        "Landscape": "landscape",
        "Atmosphere": "atmosphere",
        "Water / Coast": "landscape"
      },
      space: {
        "Wide open": "open",
        "Medium space": "normal",
        "Tight space": "tight_space",
        "Near obstacles": "near_objects"
      },
      time: {
        "5 min": "short",
        "10 min": "medium",
        "20 min": "long",
        "Full shoot": "full"
      },
      resultType: {
        "Quick cinematic clips": "quick",
        "Full short sequence": "sequence",
        "Social media reel": "reel",
        "Establishing shots": "establishing",
        "Dynamic action shots": "dynamic"
      },
      mood: {
        "Smooth": "smooth",
        "Epic": "epic",
        "Dynamic": "dynamic",
        "Tense": "tense",
        "Wow": "wow"
      }
    };

    return map?.[stepKey]?.[label] || String(label).toLowerCase();
  }

  function shakeFiltersButton() {
    if (!openAssistantBtn) return;
    if (!window.matchMedia("(max-width: 900px)").matches) return;

    openAssistantBtn.classList.remove("is-attention");
    void openAssistantBtn.offsetWidth;
    openAssistantBtn.classList.add("is-attention");

    setTimeout(() => {
      openAssistantBtn.classList.remove("is-attention");
    }, 1600);
  }

  window.addEventListener("resize", setPlayerViewportHeight);
  window.addEventListener("orientationchange", setPlayerViewportHeight);
  setPlayerViewportHeight();

  let _memberCache = null;
  let _memberCacheAt = 0;

  async function getMember(timeout = 12000) {
    const now = Date.now();
    if (_memberCache && now - _memberCacheAt < 15000) return _memberCache;

    const t0 = Date.now();

    while (Date.now() - t0 < timeout) {
      const ms = window.$memberstackDom || window.$memberstack;
      const fn = ms?.getCurrentMember || ms?.getCurrentUser;

      if (typeof fn === "function") {
        try {
          const res = await fn.call(ms);
          const m = res?.data || res;

          if (m?.id) {
            _memberCache = m;
            _memberCacheAt = Date.now();
            return m;
          }
        } catch (_) {}
      }

      await sleep(250);
    }

    return null;
  }

  async function api(path, opts = {}) {
    const member = await getMember(12000);

    if (!member?.id) {
      const err = new Error("LOGIN_REQUIRED");
      err.status = 401;
      throw err;
    }

    const headers = new Headers(opts.headers || {});
    headers.set("x-ms-id", member.id);

    if (opts.body && !(opts.body instanceof FormData) && !headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }

    const r = await fetch(API_BASE + path, { method: opts.method || "GET", ...opts, headers });
    const ct = (r.headers.get("content-type") || "").toLowerCase();
    const isJson = ct.includes("application/json");
    const payload = isJson ? await r.json().catch(() => null) : await r.text().catch(() => null);

    if (!r.ok) {
      const e = new Error("HTTP_" + r.status);
      e.status = r.status;
      e.payload = payload;
      throw e;
    }

    return payload;
  }

  let savedCache = [];
  let savedItemKeys = new Set();
  let accessCache = {
    isPro: false,
    ownedPacks: []
  };

  const PRO_BETA_PACK_ID = String(window.SM_PRO_BETA_PACK_ID || "real_estate_creator_pack");
  const LOCAL_SAVED_MOVES_KEY = "sm_pro_saved_moves_v1";
  const LOCAL_SAVED_ITEMS_KEY = "sm_pro_saved_items_v1";

  function normalizeSavedMoveRecord(x = {}) {
    const id = x?.id || x?.video_id || x?.slug || x?.videoUrl || x?.video_url || "";
    if (!id) return null;

    return {
      ...x,
      id,
      title: x?.title || "",
      thumb: x?.thumb || FALLBACK_THUMB,
      videoUrl: x?.videoUrl || x?.video_url || "",
      video_url: x?.video_url || x?.videoUrl || "",
      duration: x?.duration || "",
      env: Array.isArray(x?.env) ? x.env : [],
      risk: Array.isArray(x?.risk) ? x.risk : [],
      subject: Array.isArray(x?.subject) ? x.subject : [],
      pilot: Array.isArray(x?.pilot) ? x.pilot : [],
      mood: Array.isArray(x?.mood) ? x.mood : [],
    };
  }

  function readLocalJson(key, fallback) {
    try {
      const raw = window.localStorage?.getItem(key);
      if (!raw) return fallback;
      const parsed = JSON.parse(raw);
      return parsed ?? fallback;
    } catch (_) {
      return fallback;
    }
  }

  function loadLocalSavedState() {
    const localMoves = readLocalJson(LOCAL_SAVED_MOVES_KEY, []);
    const localKeys = readLocalJson(LOCAL_SAVED_ITEMS_KEY, []);

    if (Array.isArray(localMoves)) {
      const normalized = localMoves.map(normalizeSavedMoveRecord).filter(Boolean);
      const byId = new Map(savedCache.map((item) => [String(item?.id || ""), item]));
      normalized.forEach((item) => byId.set(String(item.id), item));
      savedCache = Array.from(byId.values()).filter((item) => item?.id);
    }

    if (Array.isArray(localKeys)) {
      localKeys.forEach((key) => {
        const clean = String(key || "").trim();
        if (clean && clean !== ":") savedItemKeys.add(clean);
      });
    }

    syncMoveKeysFromSavedCache();
  }

  function persistLocalSavedState() {
    try {
      window.localStorage?.setItem(LOCAL_SAVED_MOVES_KEY, JSON.stringify(savedCache || []));
      window.localStorage?.setItem(LOCAL_SAVED_ITEMS_KEY, JSON.stringify(Array.from(savedItemKeys || [])));
    } catch (_) {}
  }

  function getSavedKey(type, id) {
    return `${String(type || "").trim().toLowerCase()}:${String(id || "").trim()}`;
  }

  function isGenericSaved(type, id) {
    return savedItemKeys.has(getSavedKey(type, id));
  }

  function addSavedKey(type, id) {
    const key = getSavedKey(type, id);
    if (key !== ":") savedItemKeys.add(key);
  }

  function removeSavedKey(type, id) {
    savedItemKeys.delete(getSavedKey(type, id));
  }

  function syncMoveKeysFromSavedCache() {
    if (!Array.isArray(savedCache)) return;
    savedCache.forEach((item) => {
      const id = item?.id || item?.video_id || item?.slug || item?.videoUrl || item?.video_url || "";
      if (id) addSavedKey("move", id);
    });
  }

  async function hydrateAccessCache() {
    try {
      const data = await api(`/v1/me/access`, { method: "GET" });
      const ownedPacks = Array.isArray(data?.owned_packs) ? data.owned_packs : [];

      accessCache = {
        isPro: Boolean(data?.is_pro || data?.pro || data?.has_pro),
        ownedPacks: [...ownedPacks]
      };

      if (accessCache.isPro && PRO_BETA_PACK_ID && !accessCache.ownedPacks.includes(PRO_BETA_PACK_ID)) {
        accessCache.ownedPacks.push(PRO_BETA_PACK_ID);
      }
    } catch (e) {
      // Non-blocking: Pro UI should still work while backend access endpoint is being finalized.
      console.warn("[SM PRO] access hydrate failed", e?.status, e?.payload || e);
      accessCache = { isPro: false, ownedPacks: [] };
    }
  }

  async function hydrateSavedItemsCache() {
    try {
      const data = await api(`/v1/saved-items`, { method: "GET" });
      const list = Array.isArray(data)
        ? data
        : Array.isArray(data?.items) ? data.items
        : Array.isArray(data?.saved_items) ? data.saved_items
        : [];

      list
        .map((item) => getSavedKey(item?.item_type || item?.type, item?.item_id || item?.id))
        .filter((key) => key && key !== ":")
        .forEach((key) => savedItemKeys.add(key));
    } catch (e) {
      // Older backend may not have /v1/saved-items yet, or local Memberstack may be missing.
      // Do not wipe local saved state. Keep localStorage as the fallback source of truth for dev.
      console.warn("[SM PRO] saved-items hydrate failed", e?.status, e?.payload || e);
    }

    syncMoveKeysFromSavedCache();
    persistLocalSavedState();
  }

  async function hydrateSavedCache() {
    try {
      const data = await api(`/v1/saved-moves?limit=200&offset=0`, { method: "GET" });

      const list = Array.isArray(data)
        ? data
        : Array.isArray(data?.items) ? data.items
        : Array.isArray(data?.saved_moves) ? data.saved_moves
        : Array.isArray(data?.moves) ? data.moves
        : [];

      const backendSaved = list.map(normalizeSavedMoveRecord).filter(Boolean);
      const byId = new Map(savedCache.map((item) => [String(item?.id || ""), item]));
      backendSaved.forEach((item) => byId.set(String(item.id), item));
      savedCache = Array.from(byId.values()).filter((item) => item?.id);
      syncMoveKeysFromSavedCache();
      persistLocalSavedState();
    } catch (e) {
      // Do not clear savedCache here. On localhost/backend failure, localStorage must keep saved items after reload.
      console.warn("[SM] saved-moves GET failed", e?.status, e?.payload || e);
      syncMoveKeysFromSavedCache();
      persistLocalSavedState();
    }
  }

  function isSaved(id) {
    return Array.isArray(savedCache) && savedCache.some((x) => String(x?.id) === String(id));
  }

  function syncSavedMoveToBackend(action, id, payload) {
    // Backend sync is intentionally non-blocking. The save icon must update instantly,
    // even on localhost where Memberstack may not be available.
    const task = action === "save"
      ? api(`/v1/saved-moves`, {
          method: "POST",
          body: JSON.stringify(payload)
        }).then(() => {
          api(`/v1/saved-items`, {
            method: "POST",
            body: JSON.stringify({ item_type: "move", item_id: id })
          }).catch(() => null);
        })
      : api(`/v1/saved-moves/${encodeURIComponent(id)}`, { method: "DELETE" })
          .then(() => {
            api(`/v1/saved-items/${encodeURIComponent("move")}/${encodeURIComponent(id)}`, { method: "DELETE" }).catch(() => null);
          });

    task
      .then(() => hydrateSavedCache())
      .then(() => {
        if (activeProTab === "saved") renderResults();
      })
      .catch((e) => {
        console.warn(`[SM] ${action} sync failed`, e?.status, e?.payload || e);
      });
  }

  function toggleSaved(video) {
    const id = getVideoId(video);

    const payload = {
      id,
      title: video?.title || "",
      thumb: video?.thumb || FALLBACK_THUMB,
      video_url: video?.videoUrl || video?.video_url || "",
      duration: video?.duration || "",
      env: video?.env || [],
      risk: video?.risk || [],
      subject: video?.subject || [],
      pilot: video?.pilot || [],
      mood: video?.mood || [],
    };

    const wasSaved = isSaved(id);

    if (wasSaved) {
      savedCache = savedCache.filter((x) => String(x?.id) !== String(id));
      removeSavedKey("move", id);
    } else {
      savedCache = [payload, ...savedCache.filter((x) => String(x?.id) !== String(id))];
      addSavedKey("move", id);
    }

    persistLocalSavedState();

    emit("sm:save_clicked", {
      item_id: id,
      action: wasSaved ? "unsave" : "save",
      item_type: "move",
      title: video?.title || ""
    });

    syncSavedMoveToBackend(wasSaved ? "unsave" : "save", id, payload);

    return !wasSaved;
  }

  function toggleSavedPack(pack) {
    const id = String(pack?.id || "");
    if (!id) return false;

    const wasSaved = isGenericSaved("pack", id);

    if (wasSaved) removeSavedKey("pack", id);
    else addSavedKey("pack", id);

    persistLocalSavedState();

    emit("sm:save_clicked", {
      item_id: id,
      action: wasSaved ? "unsave" : "save",
      item_type: "pack",
      title: pack?.title || ""
    });

    const task = wasSaved
      ? api(`/v1/saved-items/${encodeURIComponent("pack")}/${encodeURIComponent(id)}`, { method: "DELETE" })
      : api(`/v1/saved-items`, {
          method: "POST",
          body: JSON.stringify({ item_type: "pack", item_id: id })
        });

    task
      .then(() => hydrateSavedItemsCache())
      .then(() => {
        if (activeProTab === "saved") renderResults();
      })
      .catch((e) => {
        console.warn("[SM PRO] pack save sync failed", e?.status, e?.payload || e);
      });

    return !wasSaved;
  }

  const locks = { drawer: false, modal: false };

  function applyOverflow() {
    const videoOpen = modal.getAttribute("aria-hidden") === "false";
    const lock = locks.drawer || videoOpen || locks.modal;
    const packDetailOpen = scope.classList.contains("sm-pro-pack-detail-active") || document.documentElement.classList.contains("sm-pack-detail-open");

    if (lock) {
      document.documentElement.style.setProperty("overflow", "hidden", "important");
      document.body.style.setProperty("overflow", "hidden", "important");
      return;
    }

    if (packDetailOpen) {
      setPackDetailPageMode(true);
      return;
    }

    document.documentElement.style.removeProperty("overflow");
    document.documentElement.style.removeProperty("overflow-x");
    document.documentElement.style.removeProperty("overflow-y");
    document.body.style.removeProperty("overflow");
    document.body.style.removeProperty("overflow-x");
    document.body.style.removeProperty("overflow-y");
  }

  function isDrawerMode() {
    return window.matchMedia("(max-width: 900px)").matches;
  }

  function openAssistant() {
    // Mobile Pro filters must render BEFORE the drawer becomes visible.
    // Otherwise the old Free Library chat filter flashes for a split second.
    if (filterUsesProUi() && isProMobilePortrait()) {
      assistant.classList.add("sm-pro-filter-screen");
      chat.innerHTML = "";
      renderOptions();
      updateFilterUi();
    }

    assistant.classList.add("active");
    if (assistantBackdropEl) assistantBackdropEl.style.display = "block";
    scope.classList.add("smFiltersOpen");
    locks.drawer = true;
    applyOverflow();
  }

  function closeAssistant() {
    assistant.classList.remove("active");
    if (assistantBackdropEl) assistantBackdropEl.style.display = "none";
    scope.classList.remove("smFiltersOpen");
    locks.drawer = false;
    applyOverflow();
  }

  function goToResults() {
    closeAssistant();

    const results = scope.querySelector(".results");
    if (results) {
      setTimeout(() => {
        results.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 80);
    }
  }

  if (openAssistantBtn) openAssistantBtn.addEventListener("click", openAssistant);
  if (closeAssistantBtn) closeAssistantBtn.addEventListener("click", closeAssistant);
  if (assistantBackdropEl) assistantBackdropEl.addEventListener("click", closeAssistant);
  if (showResultsBtn) showResultsBtn.addEventListener("click", goToResults);
  if (backToResultsBtn) backToResultsBtn.addEventListener("click", goToResults);

  window.addEventListener("resize", () => {
    if (!isDrawerMode()) {
      locks.drawer = false;
      if (assistantBackdropEl) assistantBackdropEl.style.display = "none";
      scope.classList.remove("smFiltersOpen");
      assistant.classList.remove("active");
      applyOverflow();
    }
  });

  function setModal(open) {
    modal.setAttribute("aria-hidden", open ? "false" : "true");
    locks.modal = !!open;
    applyOverflow();
  }

  let currentIndex = -1;
  let returnToPlanAfterClose = false;

  function closeModal() {
    const shouldReturnToPlan = returnToPlanAfterClose === true;

    try { modal._cleanup && modal._cleanup(); } catch (_) {}
    modal._cleanup = null;

    setModal(false);
    modalContent.innerHTML = "";
    modal.classList.remove("isPlan");
    returnToPlanAfterClose = false;

    if (shouldReturnToPlan) {
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent("sm:reopen-plan-after-player"));
      }, 20);
    }
  }

  function setFsUiHidden(hidden) {
    modal.classList.toggle("is-fs-ui-hidden", !!hidden);
  }

  function isElementFullscreen(el) {
    return document.fullscreenElement === el || document.webkitFullscreenElement === el;
  }

  async function enterPlayerFullscreen(player) {
    if (!player) return;

    setFsUiHidden(true);

    try {
      if (player.webkitEnterFullscreen) {
        player.webkitEnterFullscreen();
        return;
      }

      if (!isElementFullscreen(modal)) {
        if (modal.requestFullscreen) {
          await modal.requestFullscreen({ navigationUI: "hide" }).catch(() => modal.requestFullscreen());
        } else if (modal.webkitRequestFullscreen) {
          modal.webkitRequestFullscreen();
        }
      }

      const so = screen.orientation;
      if (so && so.lock) {
        try { await so.lock("landscape"); } catch (_) {}
      }
    } catch (_) {
      setFsUiHidden(false);
    }
  }

  async function exitPlayerFullscreen() {
    try {
      if (document.fullscreenElement && document.exitFullscreen) {
        await document.exitFullscreen();
      } else if (document.webkitFullscreenElement && document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      }
    } catch (_) {}

    try {
      const so = screen.orientation;
      if (so && so.unlock) so.unlock();
    } catch (_) {}

    setFsUiHidden(false);
  }

  function bindFullscreenState(player) {
    const sync = () => {
      if (!isElementFullscreen(modal)) setFsUiHidden(false);
    };

    document.addEventListener("fullscreenchange", sync);
    document.addEventListener("webkitfullscreenchange", sync);

    if (player) {
      player.addEventListener("webkitbeginfullscreen", () => setFsUiHidden(true));
      player.addEventListener("webkitendfullscreen", () => setFsUiHidden(false));
    }

    return () => {
      document.removeEventListener("fullscreenchange", sync);
      document.removeEventListener("webkitfullscreenchange", sync);
    };
  }

  function isMobilePlayerUi() {
    return window.matchMedia("(max-width: 900px)").matches;
  }

  function isPortraitViewport() {
    return window.matchMedia("(orientation: portrait)").matches;
  }

  function shouldShowRotateHint() {
    return isMobilePlayerUi() && isPortraitViewport();
  }

  function setRotateHintVisible(visible) {
    const hint = $("rotateHint");
    if (!hint) return;
    hint.classList.toggle("is-visible", !!visible);
  }

  function bindRotateHint() {
    let hideTimer = null;

    const update = () => setRotateHintVisible(shouldShowRotateHint());

    const showTemporarily = () => {
      clearTimeout(hideTimer);
      update();

      if (shouldShowRotateHint()) {
        hideTimer = setTimeout(() => {
          setRotateHintVisible(false);
        }, 2600);
      }
    };

    window.addEventListener("resize", update);
    window.addEventListener("orientationchange", update);

    showTemporarily();

    return () => {
      clearTimeout(hideTimer);
      window.removeEventListener("resize", update);
      window.removeEventListener("orientationchange", update);
      setRotateHintVisible(false);
    };
  }

  function togglePlayerPlayback(player, playPauseBtn) {
    if (!player) return;

    if (player.paused) {
      player.play().catch(() => {});
    } else {
      player.pause();
    }

    if (playPauseBtn) {
      playPauseBtn.textContent = player.paused ? "Play" : "Pause";
    }
  }

  window.addEventListener("keydown", (e) => {
    const modalOpen = modal.getAttribute("aria-hidden") === "false";

    if (e.key === "Escape") {
      if (modalOpen) {
        closeModal();
        return;
      }

      if (assistant.classList.contains("active")) {
        closeAssistant();
      }

      return;
    }

    if (!modalOpen) return;

    if (e.code === "Space" || e.key === " ") {
      const player = $("playerVideo");
      const playPauseBtn = $("playPauseBtn");
      if (!player) return;

      const tag = String(document.activeElement?.tagName || "").toLowerCase();
      const isTypingTarget = tag === "input" || tag === "textarea" || document.activeElement?.isContentEditable;
      if (isTypingTarget) return;

      e.preventDefault();
      togglePlayerPlayback(player, playPauseBtn);
    }
  });

  let isBusy = false;
  const history = [];

  // Unified library: render the filter in the FREE-library style (chat bubbles +
  // plain chips) instead of the Pro "Shoot Builder" tiles/step-copy. VISUAL only —
  // questions, steps and filtering logic are unchanged. Set false to restore Pro UI.
  const SM_FREE_STYLE_FILTER = true;
  function filterUsesProUi() {
    return !SM_FREE_STYLE_FILTER && (isProMobilePortrait() || isProDesktopLayout());
  }

  const steps = [
    {
      key: "env",
      text: "Where are you flying?",
      help: "Choose the place that feels closest to your real location.",
      options: ["Mountains", "City / Urban", "Forest", "Open landscape", "Beach / Coast", "Near objects"]
    },
    {
      key: "subject",
      text: "What are you filming?",
      help: "Pick the main subject you want to make look cinematic.",
      options: ["Person", "Car / Bike", "Building", "Landscape", "Atmosphere", "Water / Coast"]
    },
    {
      key: "space",
      text: "How much space do you have?",
      help: "This helps avoid moves that are too risky for your location.",
      options: ["Wide open", "Medium space", "Tight space", "Near obstacles"]
    },
    {
      key: "risk",
      text: "How safe does the location feel?",
      help: "Choose based on wind, people, obstacles, and your control today.",
      options: ["Very safe", "Some risks", "Wind / difficult conditions", "Crowded / limited control"]
    },
    {
      key: "time",
      text: "How much time do you have on location?",
      help: "SkyMotion will avoid shoots that are too long for your situation.",
      options: ["5 min", "10 min", "20 min", "Full shoot"]
    },
    {
      key: "resultType",
      text: "What result do you want?",
      help: "Choose what you want to create from this shoot.",
      options: ["Quick cinematic clips", "Full short sequence", "Social media reel", "Establishing shots", "Dynamic action shots"]
    },
    {
      key: "mood",
      text: "What style do you want?",
      help: "This changes the feeling of the recommended moves and plans.",
      options: ["Smooth", "Epic", "Dynamic", "Tense", "Wow"]
    }
  ];

  const state = {};
  let stepIndex = 0;

  function setBusy(v) {
    isBusy = v;
    resetBtn.disabled = v;
    if (backBtn) backBtn.disabled = v || history.length === 0;
    chat.querySelectorAll(".opt").forEach((b) => (b.disabled = v));
  }

  function scrollChatBottom() {
    chat.scrollTop = chat.scrollHeight;
  }

  function addBotRow() {
    const row = document.createElement("div");
    row.className = "msg msg--bot";
    row.innerHTML = `
      <div class="avatar"></div>
      <div class="bubble">
        <span class="text"></span>
        <span class="caret"></span>
      </div>
    `;
    chat.appendChild(row);
    scrollChatBottom();
    return row;
  }

  function addUserRow(text) {
    const row = document.createElement("div");
    row.className = "msg msg--user";
    row.innerHTML = `
      <div class="bubble">
        <span class="text">${escapeHtml(text)}</span>
      </div>
    `;
    chat.appendChild(row);
    scrollChatBottom();
    return row;
  }

  async function addBotTyped(text) {
    setBusy(true);

    const safe = escapeHtml(text);
    const row = addBotRow();
    const textEl = row.querySelector(".text");
    const caretEl = row.querySelector(".caret");

    for (let i = 0; i < safe.length; i++) {
      textEl.innerHTML += safe[i];
      scrollChatBottom();
      await sleep(10 + Math.random() * 16);
    }

    await sleep(120);
    if (caretEl) caretEl.remove();
    setBusy(false);
  }

  function clearOptions() {
    chat.querySelectorAll(".options").forEach((el) => el.remove());
  }

  function removeFilterHelp() {
    chat.querySelectorAll(".filterHelp").forEach((el) => el.remove());
  }

  function showNoMatch(btn, label) {
    removeFilterHelp();

    if (btn) {
      btn.classList.remove("is-shaking");
      void btn.offsetWidth;
      btn.classList.add("is-shaking");

      setTimeout(() => {
        btn.classList.remove("is-shaking");
      }, 520);
    }

    if (isProMobilePortrait()) {
      assistant.classList.remove("sm-pro-reject");
      void assistant.offsetWidth;
      assistant.classList.add("sm-pro-reject");
      setTimeout(() => assistant.classList.remove("sm-pro-reject"), 560);
    }

    const help = document.createElement("div");
    help.className = "filterHelp sm-pro-filter-warning";
    help.innerHTML = `
      <strong>No matching results</strong>
      “${escapeHtml(label)}” would remove all recommendations. Choose another option or reset filters.
    `;

    const options = chat.querySelector(".options");
    if (options) options.insertAdjacentElement("afterend", help);
    else chat.appendChild(help);

    scrollChatBottom();
  }

  let allItems = [];
  let filtered = [];
  let visibleCount = 12;
  let activeProTab = "all";
  let activeMoveLevel = "all";
  let proSearchOpen = false;
  let proSearchQuery = "";
  let proSearchInputRef = null;
  let activeProPackId = null;
  let isInitialLoading = true;

  function getFilterSelected(nextState = state) {
    return {
      env: normalizeFilterValue("env", nextState.env),
      risk: normalizeFilterValue("risk", nextState.risk),
      subject: normalizeFilterValue("subject", nextState.subject),
      mood: normalizeFilterValue("mood", nextState.mood),
      space: normalizeFilterValue("space", nextState.space),
      time: normalizeFilterValue("time", nextState.time),
      resultType: normalizeFilterValue("resultType", nextState.resultType),
    };
  }

  function getStrictFilteredItems(nextState = state) {
    const selected = getFilterSelected(nextState);

    return allItems.filter((item) => (
      hasMatch(item.env, selected.env) &&
      hasMatch(item.risk, selected.risk) &&
      hasMatch(item.subject, selected.subject) &&
      hasMatch(item.mood, selected.mood)
    ));
  }

  function getFilteredItems(nextState = state) {
    // Real filtering stays strict for the fields that exist in the Free Library data.
    // space/time/resultType are collected for the future Pro data model, but do not
    // filter yet because the current CDN index does not have reliable tags for them.
    return getStrictFilteredItems(nextState);
  }

  function updateFilterUi() {
    if (filterProgressBar) {
      const answered = Math.min(stepIndex, steps.length);
      const progress = Math.max(1, (answered / steps.length) * 100);
      filterProgressBar.style.width = `${progress}%`;
    }

    updateFilterHero();

    const count = filtered.length;
    const disabled = count <= 0;
    const label = disabled ? "No results" : `Show ${count} results...`;

    if (showResultsBtn) {
      if (disabled) {
        showResultsBtn.innerHTML = "No moves found";
        showResultsBtn.disabled = true;
      } else {
        showResultsBtn.innerHTML = `Show <span id="matchCount">${count}</span> ${count === 1 ? "move" : "moves"}`;
        showResultsBtn.disabled = false;
      }
    }

    const bottomBtn = ensureMobileShowButton();
    if (bottomBtn) {
      bottomBtn.innerHTML = `${label} <span aria-hidden="true">→</span>`;
      bottomBtn.disabled = disabled;
    }
  }

  function ensureMobileShowButton() {
    if (mobileShowResultsBtn) return mobileShowResultsBtn;
    const footerRow = scope.querySelector(".assistant__footerRow");
    if (!footerRow) return null;

    mobileShowResultsBtn = document.createElement("button");
    mobileShowResultsBtn.className = "btn sm-pro-filter-show-bottom";
    mobileShowResultsBtn.type = "button";
    mobileShowResultsBtn.innerHTML = "Show results →";
    mobileShowResultsBtn.addEventListener("click", goToResults);
    footerRow.appendChild(mobileShowResultsBtn);
    return mobileShowResultsBtn;
  }

  function ensureFilterHero() {
    const useProFilterScreen = filterUsesProUi();

    if (!useProFilterScreen) {
      assistant?.classList.remove("sm-pro-filter-screen", "sm-pro-desktop-filter");
      return null;
    }

    assistant?.classList.add("sm-pro-filter-screen");
    assistant?.classList.toggle("sm-pro-desktop-filter", isProDesktopLayout());

    let hero = scope.querySelector(".sm-pro-filter-hero");
    if (hero) {
      hero.classList.toggle("sm-pro-filter-hero--desktop", isProDesktopLayout());
      return hero;
    }

    hero = document.createElement("div");
    hero.className = "sm-pro-filter-hero";
    hero.innerHTML = `
      <div class="sm-pro-filter-brand">
        <button class="sm-pro-filter-back" type="button" aria-label="Back to library">‹</button>
        <div class="sm-pro-filter-brandText">
          <div class="sm-pro-filter-titleRow">
            <span class="sm-pro-filter-title">Pro Library</span>
            <span class="sm-pro-filter-badge">PRO</span>
          </div>
          <div class="sm-pro-filter-subtitle">Choose your flight context to find the right moves faster.</div>
        </div>
      </div>
      <div class="sm-pro-filter-segments" aria-hidden="true"></div>
    `;

    hero.classList.toggle("sm-pro-filter-hero--desktop", isProDesktopLayout());

    const chatEl = scope.querySelector(".chat");
    if (chatEl?.parentNode) chatEl.parentNode.insertBefore(hero, chatEl);

    const back = hero.querySelector(".sm-pro-filter-back");
    back?.addEventListener("click", goToResults);
    return hero;
  }

  function updateFilterHero() {
    const hero = ensureFilterHero();
    if (!hero) return;
    const segments = hero.querySelector(".sm-pro-filter-segments");
    if (!segments) return;

    const current = Math.min(stepIndex, steps.length - 1);
    segments.innerHTML = steps.map((_, index) => {
      const active = index <= current ? " is-active" : "";
      const done = index < stepIndex ? " is-done" : "";
      const currentClass = index === current ? " is-current" : "";
      return `<span class="sm-pro-filter-segment${active}${done}${currentClass}"></span>`;
    }).join("");
  }

  function getEnvArtClass(label) {
    const key = String(label || "").toLowerCase();
    if (key.includes("mountain")) return "sm-env-art-mountains";
    if (key.includes("city")) return "sm-env-art-city";
    if (key.includes("forest")) return "sm-env-art-forest";
    if (key.includes("beach") || key.includes("coast")) return "sm-env-art-beach";
    if (key.includes("near")) return "sm-env-art-near";
    if (key.includes("tight")) return "sm-env-art-tight";
    return "sm-env-art-open";
  }


  function getItemThumbForEnv(item) {
    if (!item) return "";

    if (isPlan(item)) {
      const stepsArr = Array.isArray(item?.steps) ? item.steps : [];
      return pickThumb(
        item?.thumb?.a,
        item?.thumb_a,
        stepsArr?.[0]?.thumb,
        stepsArr?.[0]?.poster,
        item?.thumb,
        FALLBACK_THUMB
      );
    }

    return pickThumb(
      item?.thumb,
      item?.poster,
      item?.image,
      item?.thumb_a,
      FALLBACK_THUMB
    );
  }

  function scoreEnvThumbCandidate(item, label) {
    const labelKey = String(label || "").toLowerCase();
    const title = String(item?.title || item?.name || "").toLowerCase();
    const envValue = normalizeFilterValue("env", label);
    const envs = Array.isArray(item?.env) ? item.env.map((x) => String(x).toLowerCase()) : [];
    const subjects = Array.isArray(item?.subject) ? item.subject.map((x) => String(x).toLowerCase()) : [];
    const moods = Array.isArray(item?.mood) ? item.mood.map((x) => String(x).toLowerCase()) : [];

    let score = 0;
    if (envs.includes(String(envValue).toLowerCase())) score += 30;
    if (subjects.includes("landscape")) score += 8;
    if (moods.includes("epic")) score += 4;

    if (labelKey.includes("mountain") && /mount|hike|valley|peak|ridge|alps|landscape/.test(title)) score += 35;
    if (labelKey.includes("city") && /city|urban|building|street|tower/.test(title)) score += 35;
    if (labelKey.includes("forest") && /forest|tree|woods|nature/.test(title)) score += 35;
    if ((labelKey.includes("beach") || labelKey.includes("coast")) && /coast|beach|shore|water|sea|lake/.test(title)) score += 35;
    if (labelKey.includes("near") && /object|building|tree|car|person|close|reveal|gimbal/.test(title)) score += 25;
    if ((labelKey.includes("open") || labelKey.includes("landscape")) && /open|landscape|field|hike|coast|valley|drift/.test(title)) score += 25;

    if (isPlan(item)) score += 3;
    return score;
  }

  function getEnvThumb(label) {
    if (!Array.isArray(allItems) || !allItems.length) return FALLBACK_THUMB;

    const ranked = allItems
      .map((item) => ({ item, score: scoreEnvThumbCandidate(item, label), thumb: getItemThumbForEnv(item) }))
      .filter((entry) => entry.thumb && entry.thumb !== FALLBACK_THUMB)
      .sort((a, b) => b.score - a.score);

    const best = ranked.find((entry) => entry.score > 0) || ranked[0];
    return best?.thumb || FALLBACK_THUMB;
  }

  async function handleFilterOptionClick(btn, label, s) {
    if (isBusy) return;

    emit("sm:tag_clicked", {
      step_key: s.key,
      tag_name: label
    });

    const candidateState = { ...state, [s.key]: label };

    if (!isInitialLoading && getStrictFilteredItems(candidateState).length === 0) {
      showNoMatch(btn, label);
      updateFilterUi();
      return;
    }

    removeFilterHelp();

    history.push({
      stepIndex,
      prevChatHTML: (!SM_FREE_STYLE_FILTER && isProMobilePortrait()) ? "" : chat.innerHTML,
      prevState: { ...state }
    });

    if (backBtn) backBtn.disabled = history.length === 0;

    state[s.key] = label;
    stepIndex += 1;

    applyFilters();

    if (filterUsesProUi()) {
      renderOptions();
      updateFilterUi();
      return;
    }

    addUserRow(label);

    if (stepIndex >= steps.length) {
      clearOptions();
      await addBotTyped("Done. Your results are ready.");
      updateFilterUi();
      return;
    }

    await addBotTyped(steps[stepIndex].text);
    renderOptions();
    updateFilterUi();
  }

  function renderMobileStepScreen() {
    ensureFilterHero();
    chat.className = "chat sm-pro-step-mode";
    chat.innerHTML = "";

    if (stepIndex >= steps.length) {
      chat.innerHTML = `
        <div class="sm-pro-step-copy sm-pro-step-copy--final">
          <h2>Results are ready</h2>
          <p>Open the recommended moves and plans for this shoot.</p>
        </div>
      `;
      updateFilterUi();
      return;
    }

    const s = steps[stepIndex];
    const isVisualEnv = s.key === "env";

    if (isVisualEnv) chat.classList.add("sm-env-visual-mode");

    const copy = document.createElement("div");
    copy.className = "sm-pro-step-copy";
    copy.innerHTML = `
      <h2>${escapeHtml(s.text)}</h2>
      <p>${escapeHtml(s.help || "")}</p>
    `;
    chat.appendChild(copy);

    const wrap = document.createElement("div");
    wrap.className = isVisualEnv ? "options sm-env-visual-grid" : "options sm-pro-pill-grid";

    s.options.forEach((label) => {
      const btn = document.createElement("button");
      btn.type = "button";

      if (isVisualEnv) {
        btn.className = `opt sm-env-card ${getEnvArtClass(label)}`;
        btn.innerHTML = `
          <img class="sm-env-card__img" src="${escapeHtml(getEnvThumb(label))}" alt="" loading="lazy" aria-hidden="true">
          <span class="sm-env-card__paint" aria-hidden="true"></span>
          <span class="sm-env-card__label">${escapeHtml(label)}</span>
        `;
      } else {
        btn.className = "opt";
        btn.textContent = label;
      }

      btn.addEventListener("click", () => handleFilterOptionClick(btn, label, s));
      wrap.appendChild(btn);
    });

    chat.appendChild(wrap);
    scrollChatBottom();
  }

  function renderDesktopStepScreen() {
    ensureFilterHero();
    assistant?.classList.add("sm-pro-desktop-filter");
    chat.className = "chat sm-pro-step-mode sm-pro-desktop-step-mode";
    chat.innerHTML = "";

    if (stepIndex >= steps.length) {
      chat.innerHTML = `
        <div class="sm-pro-step-copy sm-pro-step-copy--final sm-pro-desktop-step-copy">
          <h2>Results are ready</h2>
          <p>Open the recommended moves and plans for this shoot.</p>
        </div>
      `;
      updateFilterUi();
      return;
    }

    const s = steps[stepIndex];
    const isVisualEnv = s.key === "env";

    if (isVisualEnv) chat.classList.add("sm-env-visual-mode");

    const copy = document.createElement("div");
    copy.className = "sm-pro-step-copy sm-pro-desktop-step-copy";
    copy.innerHTML = `
      <h2>${escapeHtml(s.text)}</h2>
      <p>${escapeHtml(s.help || "")}</p>
    `;
    chat.appendChild(copy);

    const wrap = document.createElement("div");
    wrap.className = isVisualEnv ? "options sm-env-visual-grid sm-env-visual-grid--desktop" : "options sm-pro-pill-grid sm-pro-pill-grid--desktop";

    s.options.forEach((label) => {
      const btn = document.createElement("button");
      btn.type = "button";

      if (isVisualEnv) {
        btn.className = `opt sm-env-card ${getEnvArtClass(label)}`;
        btn.innerHTML = `
          <img class="sm-env-card__img" src="${escapeHtml(getEnvThumb(label))}" alt="" loading="lazy" aria-hidden="true">
          <span class="sm-env-card__paint" aria-hidden="true"></span>
          <span class="sm-env-card__label">${escapeHtml(label)}</span>
        `;
      } else {
        btn.className = "opt";
        btn.textContent = label;
      }

      btn.addEventListener("click", () => handleFilterOptionClick(btn, label, s));
      wrap.appendChild(btn);
    });

    chat.appendChild(wrap);
    scrollChatBottom();
  }

  function renderOptions() {
    clearOptions();
    chat.classList.remove("sm-env-visual-mode", "sm-pro-step-mode", "sm-pro-desktop-step-mode");
    if (SM_FREE_STYLE_FILTER || !isProDesktopLayout()) assistant?.classList.remove("sm-pro-desktop-filter");
    if (SM_FREE_STYLE_FILTER || (!isProMobilePortrait() && !isProDesktopLayout())) assistant?.classList.remove("sm-pro-filter-screen");

    if (filterUsesProUi() && isProMobilePortrait()) {
      renderMobileStepScreen();
      return;
    }

    if (filterUsesProUi() && isProDesktopLayout()) {
      renderDesktopStepScreen();
      return;
    }

    if (stepIndex >= steps.length) return;

    const s = steps[stepIndex];
    const wrap = document.createElement("div");
    wrap.className = "options sm-pro-pill-grid";

    const currentBotBubble = chat.querySelector(".msg--bot:last-of-type .bubble");
    if (currentBotBubble) {
      currentBotBubble.setAttribute("data-help", s.help || "");
    }

    s.options.forEach((label) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "opt";
      btn.textContent = label;
      btn.addEventListener("click", () => handleFilterOptionClick(btn, label, s));
      wrap.appendChild(btn);
    });

    chat.appendChild(wrap);
    scrollChatBottom();
  }

  if (backBtn) {
    backBtn.addEventListener("click", () => {
      if (isBusy) return;

      const last = history.pop();
      if (backBtn) backBtn.disabled = history.length === 0;
      if (!last) return;

      stepIndex = last.stepIndex;

      Object.keys(state).forEach((k) => delete state[k]);
      Object.assign(state, last.prevState || {});

      if (SM_FREE_STYLE_FILTER || (!isProMobilePortrait() && !isProDesktopLayout())) {
        chat.innerHTML = last.prevChatHTML;
      } else {
        chat.innerHTML = "";
      }

      applyFilters();
      renderOptions();
      updateFilterUi();
      scrollChatBottom();
    });
  }

  resetBtn.addEventListener("click", async () => {
    if (isBusy) return;

    history.length = 0;
    stepIndex = 0;

    Object.keys(state).forEach((k) => delete state[k]);

    chat.innerHTML = "";
    clearOptions();
    removeFilterHelp();

    if (backBtn) backBtn.disabled = true;

    if (SM_FREE_STYLE_FILTER || (!isProMobilePortrait() && !isProDesktopLayout())) {
      await addBotTyped("Hi. Let’s browse moves and cinematic plans.");
      await addBotTyped(steps[0].text);
    }

    applyFilters();
    renderOptions();
    updateFilterUi();
  });

  function showSkeletons(count = 8) {
    grid.innerHTML = "";

    for (let i = 0; i < count; i++) {
      const el = document.createElement("div");
      el.className = "card sm-skeleton-card";
      el.style.minHeight = "220px";
      el.innerHTML = `<div class="sm-skeleton-fill" style="position:absolute;inset:0;"></div>`;
      grid.appendChild(el);
    }

    if (moreBtn) moreBtn.style.display = "none";
  }

  function applyFilters() {
    filtered = getFilteredItems(state);
    safeText(matchCount, String(filtered.length));
    visibleCount = 12;

    renderResults();
    updateFilterUi();

    if (!libraryViewedSent && allItems.length) {
      libraryViewedSent = true;
      emit("sm:library_viewed", {
        results_count: filtered.length
      });
    }
  }

  function bookmarkSvg() {
    return `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M6.5 3.5h11c.83 0 1.5.67 1.5 1.5v16.1c0 .78-.86 1.26-1.53.86L12 19.35 6.53 21.96C5.86 22.26 5 21.78 5 21.1V5c0-.83.67-1.5 1.5-1.5z"></path>
      </svg>
    `;
  }

  function normalizeDifficulty(value) {
    const raw = String(value || "").trim();
    if (!raw) return "";

    const key = raw.toLowerCase().replace(/[_-]+/g, " ").trim();
    if (["basic", "beginner", "easy", "simple"].includes(key)) return "Basic";
    if (["intermediate", "medium", "normal"].includes(key)) return "Intermediate";
    if (["advanced", "hard", "pro"].includes(key)) return "Advanced";
    return raw.charAt(0).toUpperCase() + raw.slice(1);
  }

  function getMoveDifficulty(v) {
    const explicit = normalizeDifficulty(
      v?.difficulty ||
      v?.level ||
      v?.skill ||
      v?.complexity ||
      v?.meta?.difficulty ||
      v?.meta?.level
    );

    if (explicit) return explicit;

    const title = String(v?.title || "").toLowerCase();

    const intermediate = [
      "orbit",
      "top down",
      "gimbal",
      "dolly",
      "reveal",
      "drift",
      "parallax",
      "circle",
      "fly through",
      "tracking"
    ];

    const advanced = [
      "fpv",
      "power loop",
      "dive",
      "spiral",
      "hyperlapse"
    ];

    if (advanced.some((x) => title.includes(x))) return "Advanced";
    if (intermediate.some((x) => title.includes(x))) return "Intermediate";
    return "Basic";
  }

  function difficultyTone(level) {
    const key = String(level || "").toLowerCase();
    if (key.includes("advanced")) return "advanced";
    if (key.includes("intermediate")) return "intermediate";
    return "basic";
  }


  function renderMoveCard(v, i) {
    const id = getVideoId(v);
    const saved = isSaved(id);
    const thumb = pickThumb(v?.thumb);
    const title = escapeHtml(v?.title || "");

    const card = document.createElement("div");
    card.className = "card";
    card.dataset.index = String(i);
    card.dataset.kind = "move";
    card.dataset.itemId = String(id);

    card.innerHTML = `
      <button class="sm-save ${saved ? "isSaved" : ""}" type="button"
        aria-label="${saved ? "Unsave" : "Save"}" data-save-id="${escapeHtml(id)}">
        ${bookmarkSvg()}
      </button>

      <div class="thumb">
        <img src="${thumb}" alt="${title || "thumb"}" loading="lazy">
      </div>

      <div class="meta">
        <div class="title">${title}</div>
        <span class="badge">${escapeHtml(v?.duration || formatSeconds(v?.duration_s) || "")}</span>
        <span class="sm-pro-difficulty-pill sm-pro-difficulty-pill--${difficultyTone(getMoveDifficulty(v))}">${escapeHtml(getMoveDifficulty(v))}</span>
      </div>
    `;

    attachImgFallback(card);
    return card;
  }

  function renderPlanCard(p, i) {
    const stepsArr = Array.isArray(p?.steps) ? p.steps : [];
    const titleRaw = p?.title || "Cinematic plan";

    const cover = pickThumb(
      p?.thumb?.a,
      p?.thumb_a,
      stepsArr?.[0]?.thumb,
      stepsArr?.[0]?.poster,
      p?.thumb,
      FALLBACK_THUMB
    );

    const shotsCount =
      Number(p?.meta?.shots_count) ||
      Number(p?.shots_count) ||
      stepsArr.length ||
      (Array.isArray(p?.edit?.shots) ? p.edit.shots.length : 0) ||
      0;

    const clipSeconds =
      Number(p?.final_clip_duration_s) ||
      Number(p?.final?.duration_s) ||
      0;

    const clipText = clipSeconds ? formatSeconds(clipSeconds) : "";

    const shootTimeMin =
      Number(p?.meta?.shoot_time_min) ||
      Number(p?.shoot_time_min) ||
      0;

    const difficulty =
      p?.meta?.difficulty ||
      p?.difficulty ||
      "Beginner";

    const metaParts = [];
    if (shootTimeMin) metaParts.push(`${shootTimeMin} min shoot`);
    if (difficulty) metaParts.push(difficulty);
    if (shotsCount) metaParts.push(`${shotsCount} shots`);

    const metaText = metaParts.join(" • ");

    const card = document.createElement("div");
    card.className = "cardPlan";
    card.dataset.index = String(i);
    card.dataset.kind = "plan";
    card.dataset.itemId = String(p?.id || "");

    card.innerHTML = `
      <div class="planMedia">
        <img class="planImg" src="${cover}" alt="${escapeHtml(titleRaw)}" loading="lazy">

        <div class="planPills">
          ${clipText ? `<span class="pill">${escapeHtml(clipText)}</span>` : ""}
          ${shotsCount ? `<span class="pill">${escapeHtml(String(shotsCount))} shots</span>` : ""}
          <span class="pill pill--plan">Plan</span>
        </div>

        <div class="planCaption">${escapeHtml(titleRaw)}</div>
      </div>

      <div class="planBubble">
        <div class="planType">Cinematic Plan</div>
        <div class="planMeta">${escapeHtml(metaText)}</div>
      </div>
    `;

    attachImgFallback(card);
    return card;
  }

  function isProMobilePortrait() {
    return window.matchMedia("(max-width: 900px) and (orientation: portrait)").matches;
  }

  function isProDesktopLayout() {
    return (
      window.matchMedia("(min-width: 901px)").matches &&
      !window.matchMedia("(max-height: 560px) and (orientation: landscape)").matches
    );
  }

  function getItemFilteredIndex(item) {
    return filtered.findIndex((x) => x === item);
  }

  function getLibraryItemFromCard(card) {
    if (!card) return null;

    const idx = Number(card.dataset.index || "-1");
    if (Number.isFinite(idx) && idx >= 0 && filtered[idx]) return filtered[idx];

    const kind = String(card.dataset.kind || "").toLowerCase();
    const itemId = String(card.dataset.itemId || "");
    if (!itemId) return null;

    return filtered.find((item) => {
      const itemKind = isPlan(item) ? "plan" : "move";
      if (kind && kind !== itemKind) return false;
      const id = isPlan(item) ? String(item?.id || item?.title || "") : String(getVideoId(item));
      return id === itemId || String(item?.title || "") === itemId;
    }) || null;
  }



  function setupProTabs() {
    const tabs = scope.querySelectorAll(".sm-pro-mobile-tabs button");
    if (!tabs.length) return;

    tabs.forEach((btn) => {
      if (btn.dataset.smProTabReady === "1") return;
      const key = String(btn.dataset.proTab || btn.textContent || "").trim().toLowerCase();
      btn.dataset.proTab = key || "all";
      btn.dataset.smProTabReady = "1";

      btn.addEventListener("click", () => {
        setProTab(btn.dataset.proTab || "all");
      });
    });
  }

  function switchProTabFromButton(e) {
    const btn = e.target.closest("[data-pro-go-tab]");
    if (!btn) return;
    e.preventDefault();
    e.stopPropagation();
    setProTab(btn.dataset.proGoTab || "all");
  }

  function renderSectionHeader(title, viewLabel = "View all", tab = "") {
    const attr = tab ? ` data-pro-go-tab="${escapeHtml(tab)}"` : "";
    return `
      <div class="sm-pro-section-head">
        <h2>${escapeHtml(title)}</h2>
        <button class="sm-pro-section-link" type="button"${attr}>${escapeHtml(viewLabel)}</button>
      </div>
    `;
  }

  function getMoveMetaText(v) {
    const mood = Array.isArray(v?.mood) && v.mood[0] ? String(v.mood[0]) : "";
    const risk = Array.isArray(v?.risk) && v.risk[0] ? String(v.risk[0]) : "";
    const difficulty = getMoveDifficulty(v);
    const pieces = [difficulty];
    if (mood) pieces.push(mood.replace(/_/g, " "));
    else if (risk) pieces.push(risk.replace(/_/g, " "));
    return pieces.join(" · ");
  }

  function getMoveDescription(v) {
    const raw =
      v?.description ||
      v?.desc ||
      v?.summary ||
      v?.note ||
      v?.meta?.description ||
      "";

    if (raw) return String(raw);

    const title = String(v?.title || "").toLowerCase();
    if (title.includes("raise")) return "Use it to reveal the scene and make the location feel bigger.";
    if (title.includes("top")) return "Use it to show the location from above and create a clean graphic view.";
    if (title.includes("orbit")) return "Use it to circle the subject and add cinematic movement to the shot.";
    if (title.includes("dolly")) return "Use it to reveal depth and make the scene feel wider.";
    if (title.includes("reveal")) return "Use it to slowly introduce the subject and build attention.";
    if (title.includes("take")) return "Use it to start the sequence and establish the location clearly.";
    if (title.includes("drift")) return "Use it to reveal a wide scene with a calm cinematic feel.";
    return "Use this move to create a cleaner cinematic shot in this location.";
  }

  function getTagLabel(arr, fallback = "") {
    if (!Array.isArray(arr) || !arr.length) return fallback;
    return String(arr[0] || fallback).replace(/_/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());
  }

  function getMoveStyleLabel(v) {
    const mood = Array.isArray(v?.mood) && v.mood[0] ? String(v.mood[0]) : "";
    const risk = Array.isArray(v?.risk) && v.risk[0] ? String(v.risk[0]) : "";
    const raw = mood || risk || "Smooth";
    const cleaned = raw.replace(/_/g, " ").trim();
    return cleaned ? cleaned.charAt(0).toUpperCase() + cleaned.slice(1) : "Smooth";
  }

  function getMoveSpaceLabel(v) {
    const envs = Array.isArray(v?.env) ? v.env.map((x) => String(x).toLowerCase()) : [];
    if (envs.includes("tight_space")) return "Tight space";
    if (envs.includes("near_objects")) return "Near objects";
    if (envs.includes("urban")) return "Urban";
    if (envs.includes("forest")) return "Forest";
    if (envs.includes("open")) return "Open space";
    return "Open space";
  }

  function getMoveSubjectLabel(v) {
    const label = getTagLabel(v?.subject, "Landscape");
    return label === "Car Bike" ? "Car / Bike" : label;
  }

  function normalizeSearchText(value) {
    return String(value || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim();
  }

  function getMoveSearchTitle(item) {
    // STRICT: search only by move title. Do not include description, tags, mood, subject, env, etc.
    return normalizeSearchText(item?.title || "");
  }

  function getMovesForSearch(moves) {
    const q = normalizeSearchText(proSearchQuery);
    if (!q) return moves;
    return moves.filter((item) => getMoveSearchTitle(item).includes(q));
  }

  function toggleProSearch(open = !proSearchOpen) {
    proSearchOpen = !!open;
    renderResults();
    if (proSearchOpen) {
      setTimeout(() => {
        if (proSearchInputRef) proSearchInputRef.focus();
      }, 60);
    }
  }

  function renderMoveListCard(v, i) {
    const id = getVideoId(v);
    const saved = isSaved(id);
    const thumb = pickThumb(v?.thumb, v?.poster, v?.image);
    const titleRaw = v?.title || "Move";
    const title = escapeHtml(titleRaw);
    const duration = escapeHtml(v?.duration || formatSeconds(v?.duration_s) || "");
    const difficulty = getMoveDifficulty(v);
    const tone = difficultyTone(difficulty);
    const description = getMoveDescription(v);

    const card = document.createElement("article");
    card.className = "sm-pro-move-row";
    card.dataset.index = String(i);
    card.dataset.kind = "move";
    card.dataset.itemId = String(id);

    card.innerHTML = `
      <div class="sm-pro-move-row__media">
        <img src="${escapeHtml(thumb)}" alt="${title}" loading="lazy">
        ${duration ? `<span class="sm-pro-move-row__time">${duration}</span>` : ""}
        <span class="sm-pro-move-row__play" aria-hidden="true"></span>
      </div>

      <div class="sm-pro-move-row__body">
        <div class="sm-pro-move-row__top">
          <div class="sm-pro-move-row__headline">
            <h3>${title}</h3>
            <div class="sm-pro-move-row__meta">
              <span class="sm-pro-difficulty-pill sm-pro-difficulty-pill--${tone}">${escapeHtml(difficulty)}</span>
            </div>
          </div>
          <button class="sm-save ${saved ? "isSaved" : ""}" type="button"
            aria-label="${saved ? "Unsave" : "Save"}" data-save-id="${escapeHtml(id)}">
            ${bookmarkSvg()}
          </button>
        </div>

        <p>${escapeHtml(description)}</p>
      </div>
    `;

    attachImgFallback(card);
    return card;
  }


  function getMovesForActiveLevel(moves) {
    if (activeMoveLevel === "saved") return moves.filter((item) => isSaved(getVideoId(item)));
    if (activeMoveLevel === "all") return moves;
    return moves.filter((item) => difficultyTone(getMoveDifficulty(item)) === activeMoveLevel);
  }

  function renderMoveLevelTabs(wrap, moves) {
    const tabs = document.createElement("div");
    tabs.className = "sm-pro-level-tabs";

    const levels = [
      ["all", "All"],
      ["basic", "Basic"],
      ["intermediate", "Intermediate"],
      ["advanced", "Advanced"],
      ["saved", "Saved"]
    ];

    levels.forEach(([key, label]) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = label;
      btn.className = key === activeMoveLevel ? "is-active" : "";
      btn.addEventListener("click", () => {
        activeMoveLevel = key;
        renderResults();
      });
      tabs.appendChild(btn);
    });

    wrap.appendChild(tabs);
  }


  function getProMovesData() {
    const allMoves = filtered.filter((item) => !isPlan(item));
    const levelMoves = getMovesForActiveLevel(allMoves);
    const moves = getMovesForSearch(levelMoves);
    return { allMoves, levelMoves, moves };
  }

  function getProMovesCountLabel(moves, levelMoves) {
    return proSearchQuery
      ? `${moves.length} found · ${levelMoves.length} total`
      : `${moves.length}/${levelMoves.length} moves`;
  }



    /* =========================
     PRO SUBSCREENS v9 — Plans / Packs / Saved aligned with Moves
     - Search is title-only on each subscreen.
     - Tool header only, no main Pro Library header.
     - Plans/Saved use practical list rows; Packs use premium pack rows.
  ========================= */

  function setProTab(tab) {
    const allowed = ["all", "moves", "plans", "packs", "saved"];
    const next = allowed.includes(tab) ? tab : "all";
    const changed = activeProTab !== next || !!activeProPackId;
    activeProTab = next;
    activeProPackId = null;
    setPackDetailPageMode(false);
    scope.classList.remove("sm-pro-pack-detail-active");

    if (changed) {
      proSearchOpen = false;
      proSearchQuery = "";
      proSearchInputRef = null;
      if (activeProTab !== "moves") activeMoveLevel = "all";
    }

    scope.classList.toggle("sm-pro-subscreen", activeProTab !== "all");

    scope.querySelectorAll(".sm-pro-mobile-tabs button").forEach((btn) => {
      const key = String(btn.dataset.proTab || btn.textContent || "").trim().toLowerCase();
      btn.classList.toggle("is-active", key === activeProTab);
    });

    visibleCount = 12;
    renderResults();
  }

  function getTitleSearchText(item) {
    return normalizeSearchText(item?.title || item?.name || "");
  }

  function filterByTitleOnly(items) {
    const q = normalizeSearchText(proSearchQuery);
    if (!q) return items;
    return items.filter((item) => getTitleSearchText(item).includes(q));
  }

  function updateProActiveLive() {
    if (!isProMobilePortrait() && !isProDesktopLayout()) return;
    if (activeProTab === "moves") return updateProMovesLive();
    if (activeProTab === "plans") return updateProPlansLive();
    if (activeProTab === "packs") return updateProPacksLive();
    if (activeProTab === "saved") return updateProSavedLive();
  }

  function renderProToolHeader(title, options = {}) {
    return `
      <div class="sm-pro-tool-header">
        <button class="sm-pro-tool-back" type="button" aria-label="Back" data-pro-go-tab="all">‹</button>
        <div class="sm-pro-tool-titleRow">
          <span class="sm-pro-tool-title">${escapeHtml(title)}</span>
          <span class="sm-pro-tool-badge">PRO</span>
        </div>
        <span class="sm-pro-tool-spacer" aria-hidden="true"></span>
      </div>
    `;
  }

  function renderProScreenShell(title) {
    grid.innerHTML = "";
    if (resultsHead) resultsHead.style.display = "none";
    if (moreBtn) moreBtn.style.display = "none";

    const wrap = document.createElement("div");
    wrap.className = "sm-pro-tab-screen";
    wrap.innerHTML = renderProToolHeader(title, { right: "none" });
    grid.appendChild(wrap);
    return wrap;
  }

  function getSearchPlaceholder() {
    if (activeProTab === "plans") return "Search by plan name";
    if (activeProTab === "packs") return "Search by pack name";
    if (activeProTab === "saved") return "Search saved moves";
    return "Search by move name";
  }

  function renderProSearchBar(wrap) {
    const search = document.createElement("div");
    search.className = `sm-pro-searchbar ${proSearchOpen ? "is-open" : ""}`;
    search.innerHTML = `
      <div class="sm-pro-searchbar__inner">
        <span class="sm-pro-searchbar__icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" focusable="false">
            <circle cx="10.5" cy="10.5" r="5.8"></circle>
            <path d="M15 15L19.5 19.5"></path>
          </svg>
        </span>
        <input type="text" inputmode="search" autocomplete="off" spellcheck="false" placeholder="${escapeHtml(getSearchPlaceholder())}" value="${escapeHtml(proSearchQuery)}" aria-label="${escapeHtml(getSearchPlaceholder())}">
        <button class="sm-pro-searchbar__clear ${proSearchQuery ? "is-visible" : ""}" type="button" aria-label="Clear search">×</button>
      </div>
    `;

    const input = search.querySelector("input");
    const clear = search.querySelector("button");
    proSearchInputRef = input;

    input?.addEventListener("input", () => {
      proSearchQuery = input.value || "";
      clear?.classList.toggle("is-visible", !!proSearchQuery);
      updateProActiveLive();
    });

    clear?.addEventListener("click", () => {
      proSearchQuery = "";
      if (input) input.value = "";
      clear?.classList.remove("is-visible");
      updateProActiveLive();
      setTimeout(() => input?.focus(), 0);
    });

    wrap.appendChild(search);
  }

  function renderProCountRow(wrap, label, ariaLabel = "Search") {
    const row = document.createElement("div");
    row.className = "sm-pro-content-count-row";
    row.innerHTML = `
      <span class="sm-pro-content-count-text" data-pro-content-count>${escapeHtml(label)}</span>
      <button class="sm-pro-tool-icon sm-pro-tool-search ${proSearchOpen ? "is-active" : ""}" type="button" aria-label="${escapeHtml(ariaLabel)}" data-pro-toggle-search="1">
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <circle cx="10.5" cy="10.5" r="5.8"></circle>
          <path d="M15 15L19.5 19.5"></path>
        </svg>
      </button>
    `;
    wrap.appendChild(row);
    return row;
  }

  function setProCount(wrap, label) {
    const countEl = wrap?.querySelector("[data-pro-content-count]") || wrap?.querySelector("[data-pro-moves-count]");
    if (countEl) countEl.textContent = label;
  }

  function renderProEmpty(wrap, title, text) {
    const empty = document.createElement("div");
    empty.className = "sm-pro-empty";
    empty.innerHTML = `
      <h3>${escapeHtml(title)}</h3>
      <p>${escapeHtml(text)}</p>
    `;
    wrap.appendChild(empty);
  }

  function renderProMovesScreen() {
    const { allMoves, levelMoves, moves } = getProMovesData();

    const wrap = renderProScreenShell("Moves");
    wrap.classList.add("sm-pro-moves-screen");

    renderMoveLevelTabs(wrap, allMoves);
    renderProSearchBar(wrap);
    renderProCountRow(wrap, getProMovesCountLabel(moves, levelMoves), "Search moves");

    const list = document.createElement("div");
    list.className = "sm-pro-move-list";
    list.setAttribute("data-pro-move-list", "1");
    wrap.appendChild(list);

    if (!moves.length) {
      renderProEmpty(wrap, "No moves found", proSearchQuery ? "No move title matches this search." : "Change the level filter or reset filters.");
      safeText(matchCount, "0");
      return;
    }

    moves.forEach((item) => {
      const idx = getItemFilteredIndex(item);
      list.appendChild(renderMoveListCard(item, idx));
    });

    attachImgFallback(wrap);
    safeText(matchCount, String(moves.length));
  }

  function updateProMovesLive() {
    if ((!isProMobilePortrait() && !isProDesktopLayout()) || activeProTab !== "moves") return;

    const wrap = scope.querySelector(".sm-pro-moves-screen");
    if (!wrap) return;

    const { levelMoves, moves } = getProMovesData();
    setProCount(wrap, getProMovesCountLabel(moves, levelMoves));

    const list = wrap.querySelector("[data-pro-move-list]");
    const oldEmpty = wrap.querySelector(".sm-pro-empty");
    if (!list) return;

    list.innerHTML = "";
    if (oldEmpty) oldEmpty.remove();

    if (!moves.length) {
      renderProEmpty(wrap, "No moves found", proSearchQuery ? "No move title matches this search." : "Change the level filter or reset filters.");
      safeText(matchCount, "0");
      return;
    }

    moves.forEach((item) => {
      const idx = getItemFilteredIndex(item);
      list.appendChild(renderMoveListCard(item, idx));
    });

    attachImgFallback(wrap);
    safeText(matchCount, String(moves.length));
  }

  function getPlanCover(p) {
    const stepsArr = Array.isArray(p?.steps) ? p.steps : [];
    return pickThumb(
      p?.thumb?.a,
      p?.thumb_a,
      stepsArr?.[0]?.thumb,
      stepsArr?.[0]?.poster,
      p?.thumb,
      FALLBACK_THUMB
    );
  }

  function getPlanShots(p) {
    const stepsArr = Array.isArray(p?.steps) ? p.steps : [];
    return Number(p?.meta?.shots_count) || Number(p?.shots_count) || stepsArr.length || (Array.isArray(p?.edit?.shots) ? p.edit.shots.length : 0) || 0;
  }

  function getPlanShootTime(p) {
    return Number(p?.meta?.shoot_time_min) || Number(p?.shoot_time_min) || 0;
  }

  function getPlanDifficulty(p) {
    return normalizeDifficulty(p?.meta?.difficulty || p?.difficulty || "Beginner");
  }

  function getPlanDescription(p) {
    const raw = p?.description || p?.meta?.description || p?.summary || "A ready-made cinematic sequence built from multiple shots.";
    return String(raw).trim();
  }

  function renderPlanListCard(p) {
    const idx = getItemFilteredIndex(p);
    const title = p?.title || "Cinematic Plan";
    const cover = getPlanCover(p);
    const shots = getPlanShots(p);
    const shootTime = getPlanShootTime(p);
    const difficulty = getPlanDifficulty(p);
    const clipSeconds = Number(p?.final_clip_duration_s) || Number(p?.final?.duration_s) || 0;
    const clipText = clipSeconds ? formatSeconds(clipSeconds) : "";
    const meta = [shootTime ? `${shootTime} min shoot` : "Shoot plan", difficulty, shots ? `${shots} shots` : "Sequence"].filter(Boolean).join(" · ");

    const card = document.createElement("article");
    card.className = "sm-pro-move-row sm-pro-plan-row";
    card.dataset.index = String(idx);
    card.dataset.kind = "plan";
    card.dataset.itemId = String(p?.id || "");

    card.innerHTML = `
      <div class="sm-pro-move-row__media">
        <img src="${escapeHtml(cover)}" alt="${escapeHtml(title)}" loading="lazy">
        ${clipText ? `<span class="sm-pro-move-row__time">${escapeHtml(clipText)}</span>` : ""}
        <span class="sm-pro-plan-row__badge">Plan</span>
      </div>

      <div class="sm-pro-move-row__body">
        <div class="sm-pro-move-row__top">
          <h3>${escapeHtml(title)}</h3>
        </div>

        <div class="sm-pro-move-row__meta">
          <span class="sm-pro-difficulty-pill sm-pro-difficulty-pill--${difficultyTone(difficulty)}">${escapeHtml(difficulty)}</span>
        </div>

        <p>${escapeHtml(getPlanDescription(p))}</p>

        <div class="sm-pro-move-row__tags">
          <span>${escapeHtml(meta)}</span>
        </div>
      </div>
    `;

    attachImgFallback(card);
    return card;
  }

  function getProPlansData() {
    const allPlans = filtered.filter(isPlan);
    const plans = filterByTitleOnly(allPlans);
    return { allPlans, plans };
  }

  function getProPlansCountLabel(plans, allPlans) {
    return proSearchQuery ? `${plans.length} found · ${allPlans.length} total` : `${plans.length}/${allPlans.length} plans`;
  }

  function renderProPlansScreen() {
    const { allPlans, plans } = getProPlansData();
    const wrap = renderProScreenShell("Plans");
    wrap.classList.add("sm-pro-plans-screen", "sm-pro-plans-poster-screen");

    renderProSearchBar(wrap);
    renderProCountRow(wrap, getProPlansCountLabel(plans, allPlans), "Search plans");

    const list = document.createElement("div");
    list.className = "sm-pro-plan-grid sm-pro-plan-poster-grid";
    list.setAttribute("data-pro-plan-list", "1");
    wrap.appendChild(list);

    if (!plans.length) {
      renderProEmpty(wrap, "No plans found", proSearchQuery ? "No plan title matches this search." : "Try a broader location, more time, or reset the filters.");
      safeText(matchCount, "0");
      return;
    }

    plans.forEach((item) => {
      const idx = getItemFilteredIndex(item);
      list.appendChild(renderPlanCard(item, idx));
    });

    attachImgFallback(wrap);
    safeText(matchCount, String(plans.length));
  }

  function updateProPlansLive() {
    if ((!isProMobilePortrait() && !isProDesktopLayout()) || activeProTab !== "plans") return;
    const wrap = scope.querySelector(".sm-pro-plans-screen");
    if (!wrap) return;
    const { allPlans, plans } = getProPlansData();
    setProCount(wrap, getProPlansCountLabel(plans, allPlans));
    const list = wrap.querySelector("[data-pro-plan-list]");
    const oldEmpty = wrap.querySelector(".sm-pro-empty");
    if (!list) return;
    list.innerHTML = "";
    if (oldEmpty) oldEmpty.remove();
    if (!plans.length) {
      renderProEmpty(wrap, "No plans found", proSearchQuery ? "No plan title matches this search." : "Try a broader location, more time, or reset the filters.");
      safeText(matchCount, "0");
      return;
    }
    plans.forEach((item) => {
      const idx = getItemFilteredIndex(item);
      list.appendChild(renderPlanCard(item, idx));
    });

    attachImgFallback(wrap);
    safeText(matchCount, String(plans.length));
  }

  function getProPackItems() {
    const plans = filtered.filter(isPlan);
    const moves = filtered.filter((item) => !isPlan(item));

    const buildingMove = moves.find((m) => hasMatch(m?.subject, "building")) ||
      moves.find((m) => String(m?.title || "").toLowerCase().includes("reveal")) ||
      moves.find((m) => String(m?.title || "").toLowerCase().includes("orbit"));

    const buildingPlan = plans.find((p) => String(p?.title || "").toLowerCase().includes("home")) ||
      plans.find((p) => String(p?.title || "").toLowerCase().includes("villa")) ||
      plans.find((p) => String(p?.title || "").toLowerCase().includes("building")) ||
      plans[0];

    const heroCover = pickThumb(
      REAL_ESTATE_PACK_COVER,
      getPlanCover(buildingPlan),
      buildingMove?.thumb,
      moves?.[0]?.thumb,
      FALLBACK_THUMB
    );

    const travelCover = (() => {
      const coverPlan = plans.find((p) => String(p?.title || "").toLowerCase().includes("hike")) || plans[0];
      return coverPlan ? getPlanCover(coverPlan) : pickThumb(moves?.[0]?.thumb, heroCover, FALLBACK_THUMB);
    })();

    return [
      {
        id: "real_estate_creator_pack",
        title: window.SM_PRO_PACK_TITLE || "Real Estate Pack",
        creator: window.SM_PRO_PACK_CREATOR || "creator name",
        label: "PACK",
        thumb: heroCover,
        meta: "13 moves · 5 plans · Checklist",
        description: window.SM_PRO_PACK_DESCRIPTION || "A practical shooting pack for real estate drone videos. Learn the key shots, camera setup, checklist and ready-made cinematic plans for property shoots.",
        bestFor: ["Real estate", "Property videos", "Client-ready sequences"],
        movesCount: 13,
        plansCount: 5,
        checklistTitle: "Open checklist",
        lessons: [
          {
            n: 1,
            title: "Intro",
            desc: "Start with the pack logic before flying.",
            duration: "1:18",
            thumb: "https://skymotion-cdn.b-cdn.net/intro-test.png"
          },
          {
            n: 2,
            title: "Camera Settings",
            desc: "Set exposure, ND and basic capture settings.",
            duration: "2:05",
            thumb: "https://skymotion-cdn.b-cdn.net/camera-settings-test.png"
          },
          {
            n: 3,
            title: "Editing Workflow",
            desc: "Turn the shots into a clean property sequence.",
            duration: "2:20",
            thumb: "https://skymotion-cdn.b-cdn.net/Editing-Workflow-test.png"
          }
        ],
        checklistGroups: [
          {
            title: "Before the shoot",
            items: [
              "Check weather & wind",
              "Inspect location on map",
              "Confirm battery levels",
              "Format SD cards",
              "Check drone firmware",
              "Scout takeoff/landing spots"
            ]
          },
          {
            title: "During the shoot",
            items: [
              "Keep line of sight",
              "Monitor battery (30% RTH)",
              "Check ND filter if needed",
              "Vary angles & heights",
              "Capture establishing shots"
            ]
          },
          {
            title: "After the shoot",
            items: [
              "Backup all footage",
              "Review key shots",
              "Note ideas for edits",
              "Charge batteries"
            ]
          }
        ],
        checklist: [
          "Check weather & wind",
          "Inspect location on map",
          "Confirm battery levels",
          "Format SD cards",
          "Check drone firmware",
          "Scout takeoff/landing spots",
          "Keep line of sight",
          "Monitor battery (30% RTH)",
          "Check ND filter if needed",
          "Vary angles & heights",
          "Capture establishing shots",
          "Backup all footage",
          "Review key shots",
          "Note ideas for edits",
          "Charge batteries"
        ],
        mistakes: [
          "Don’t repeat the same angle for every room or exterior shot.",
          "Don’t fly low near windows, people or tight balconies.",
          "Don’t forget wide establishing shots before close details."
        ]
      }
    ];
  }

  function getPackCommercialInfo(pack = {}) {
    const id = String(pack?.id || "").toLowerCase();
    const title = String(pack?.title || "").toLowerCase();
    const meta = String(pack?.meta || "");
    const moves = (meta.match(/(\d+)\s*moves/i) || [])[1] || "—";
    const plans = (meta.match(/(\d+)\s*plans/i) || [])[1] || "—";
    const hasChecklist = /checklist/i.test(meta);
    const inside = `${moves} moves · ${plans} plans${hasChecklist ? " · checklist" : ""}`;
    const rawCreator = String(pack?.creator || "").trim();
    const creatorName = (!rawCreator || rawCreator.toLowerCase() === "creator name") ? "Dominic Hayles" : rawCreator;
    const creatorBadge = `BY ${creatorName.toUpperCase()}`;

    if (id.includes("real") || title.includes("test")) {
      return {
        badge: creatorBadge,
        cardTitle: "Real Estate Starter Pack",
        intent: "For paid property shoots",
        output: "30–60s property reel · 5 hero shots",
        useCase: "Real estate / rentals",
        inside,
        level: "Beginner-friendly · 30–45 min shoot",
        bestFor: "Real estate · Property videos · Client-ready sequences"
      };
    }

    if (id.includes("travel") || title.includes("travel")) {
      return {
        badge: creatorBadge,
        cardTitle: "Travel Creator Pack",
        intent: "For paid travel / tourism shoots",
        output: "Cinematic reel · establishing shots",
        useCase: "Hotels / tourism / personal brand",
        inside,
        level: "Intermediate · fast planning",
        bestFor: "Travel reels · Location stories · Tourism content"
      };
    }

    if (id.includes("urban") || title.includes("urban")) {
      return {
        badge: creatorBadge,
        cardTitle: "Urban Creator Pack",
        intent: "For paid local business promos",
        output: "Urban reel · reveals · detail shots",
        useCase: "Local business / streets / buildings",
        inside,
        level: "Intermediate · safety-focused",
        bestFor: "City promos · Buildings · Local business videos"
      };
    }

    if (id.includes("beginner") || title.includes("beginner")) {
      return {
        badge: creatorBadge,
        cardTitle: "Beginner Safe Pack",
        intent: "For first paid client-style shoots",
        output: "Clean practice reel · simple hero shots",
        useCase: "Practice / first paid shoots",
        inside,
        level: "Beginner · low-risk moves",
        bestFor: "First paid shoots · Safe practice · Simple client videos"
      };
    }

    return {
      badge: creatorBadge,
      cardTitle: pack?.title || "Creator Pack",
      intent: "For client-ready shooting workflows",
      output: "Cinematic sequence · usable shot list",
      useCase: "Creator workflow",
      inside,
      level: "Plan faster on location",
      bestFor: "Client work · Fast planning · Cinematic sequences"
    };
  }

  function getPackInsideRows(pack = {}) {
    const meta = String(pack?.meta || "");
    const moves = (meta.match(/(\d+)\s*moves/i) || [])[1] || "—";
    const plans = (meta.match(/(\d+)\s*plans/i) || [])[1] || "—";
    let bonus = "Checklist";

    if (/pro tips/i.test(meta)) bonus = "Pro tips";
    else if (/safety tips/i.test(meta)) bonus = "Safety tips";
    else if (/practice flow/i.test(meta)) bonus = "Practice flow";
    else if (!/checklist/i.test(meta)) bonus = "Shot guide";

    return [
      [moves, "Moves"],
      [plans, "Plans"],
      [bonus, "Included"]
    ];
  }

  function renderPackInfoPanel(pack = {}) {
    const rows = getPackInsideRows(pack);

    return `
      <div class="sm-pro-pack-row__info-panel" aria-label="Pack contents">
        <div class="sm-pro-pack-row__info-title">Inside</div>
        ${rows.map(([value, label]) => `
          <div class="sm-pro-pack-row__info-item">
            <strong>${escapeHtml(value)}</strong>
            <span>${escapeHtml(label)}</span>
          </div>
        `).join("")}
      </div>
    `;
  }

  function renderPackListCard(pack) {
    const card = document.createElement("article");
    const saved = isGenericSaved("pack", pack?.id);
    const info = getPackCommercialInfo(pack);
    card.className = "sm-pro-pack-row";
    card.dataset.proPack = pack.id;
    card.innerHTML = `
      <div class="sm-pro-pack-row__media">
        <img src="${escapeHtml(pack.thumb || FALLBACK_THUMB)}" alt="${escapeHtml(pack.title)}" loading="lazy">
        <span>${escapeHtml(info.badge)}</span>
      </div>
      <div class="sm-pro-pack-row__body">
        <h3>${escapeHtml(info.cardTitle || pack.title)}</h3>
        <div class="sm-pro-pack-row__meta">${escapeHtml(info.inside)}</div>
        <p><strong>${escapeHtml(info.intent || "For paid shoots")}</strong> · ${escapeHtml(info.output || info.bestFor || "Client-ready sequence")}</p>
      </div>
      <button class="sm-pro-pack-save ${saved ? "isSaved" : ""}" type="button" aria-label="${saved ? "Unsave pack" : "Save pack"}" data-pro-pack-save="${escapeHtml(pack.id)}">
        ${bookmarkSvg()}
      </button>
    `;
    attachImgFallback(card);
    return card;
  }

  function getProPacksData() {
    const allPacks = getProPackItems();
    const packs = filterByTitleOnly(allPacks);
    return { allPacks, packs };
  }

  function getProPacksCountLabel(packs, allPacks) {
    return proSearchQuery ? `${packs.length} found · ${allPacks.length} total` : `${packs.length}/${allPacks.length} packs`;
  }


  function getActivePackItem() {
    const id = String(activeProPackId || "");
    return getProPackItems().find((pack) => String(pack.id) === id) || getProPackItems()[0] || null;
  }

  function getPackMovesForDetail(pack) {
    const moves = filtered.filter((item) => !isPlan(item));
    if (!moves.length) return [];

    const preferred = ["orbit", "raise", "top", "push", "reveal", "take", "gimbal", "dolly", "tracking", "pull", "side", "drift", "parallax"];
    const picked = [];

    preferred.forEach((key) => {
      const found = moves.find((m) => String(m?.title || "").toLowerCase().includes(key) && !picked.includes(m));
      if (found) picked.push(found);
    });

    moves.forEach((m) => {
      if (picked.length < 13 && !picked.includes(m)) picked.push(m);
    });

    return picked.slice(0, 13);
  }

  function getPackPlansForDetail(pack) {
    const plans = filtered.filter(isPlan);
    return plans.slice(0, 5);
  }

  function renderPackLessonCard(lesson) {
    return `
      <article class="sm-pro-pack-lesson" data-pro-lesson="${escapeHtml(lesson.title)}">
        <img src="${escapeHtml(lesson.thumb || FALLBACK_THUMB)}" alt="${escapeHtml(lesson.title)}" loading="lazy">
        <span class="sm-pro-pack-lesson__shade" aria-hidden="true"></span>
        <span class="sm-pro-pack-lesson__num">${escapeHtml(lesson.n)}</span>
        <span class="sm-pro-pack-lesson__play" aria-hidden="true"></span>
        <div class="sm-pro-pack-lesson__body">
          <h3>${escapeHtml(lesson.title)}</h3>
          ${lesson.duration ? `<small>${escapeHtml(lesson.duration)}</small>` : ""}
        </div>
      </article>
    `;
  }

  function renderPackMoveTile(move, slotIndex = 0) {
    const fallbackTitles = ["Orbit", "Raise Up", "Top Down", "Push Out", "Move + Gimbal Up", "Take Off"];
    const fallbackDurations = ["0:15", "0:21", "0:21", "0:10", "0:10", "0:11"];
    const idx = move ? getItemFilteredIndex(move) : -1;
    const id = move ? getVideoId(move) : `pack-placeholder-move-${slotIndex + 1}`;
    const saved = move ? isSaved(id) : false;
    const title = move?.title || fallbackTitles[slotIndex % fallbackTitles.length] || "Move";
    const duration = move?.duration || formatSeconds(move?.duration_s) || fallbackDurations[slotIndex % fallbackDurations.length] || "";
    const difficulty = getMoveDifficulty(move || { title });
    const tone = difficultyTone(difficulty);
    const thumb = pickThumb(move?.thumb, move?.poster, move?.image, filtered.find((item) => !isPlan(item))?.thumb, FALLBACK_THUMB);
    const clickAttrs = move
      ? `data-index="${idx}" data-kind="move" data-item-id="${escapeHtml(id)}"`
      : `data-pack-placeholder-move="${slotIndex + 1}"`;

    return `
      <article class="sm-pro-pack-move-card" ${clickAttrs}>
        <img class="sm-pro-pack-move-card__img" src="${escapeHtml(thumb)}" alt="${escapeHtml(title)}" loading="lazy">
        <span class="sm-pro-pack-move-card__shade" aria-hidden="true"></span>
        ${duration ? `<span class="sm-pro-pack-move-card__time">${escapeHtml(duration)}</span>` : ""}
        ${move ? `<button class="sm-save ${saved ? "isSaved" : ""}" type="button" aria-label="${saved ? "Unsave" : "Save"}" data-save-id="${escapeHtml(id)}">
          ${bookmarkSvg()}
        </button>` : ""}
        <div class="sm-pro-pack-move-card__meta">
          <h3>${escapeHtml(title)}</h3>
          <span class="sm-pro-difficulty-pill sm-pro-difficulty-pill--${tone}">${escapeHtml(difficulty)}</span>
        </div>
      </article>
    `;
  }

  function renderPackMoreMovesCard(hiddenCount = 0) {
    if (hiddenCount <= 0) return "";
    return `
      <button class="sm-pro-pack-more-moves" type="button" data-pro-go-tab="moves">
        <strong>+${hiddenCount}</strong>
        <span>more moves</span>
        <em aria-hidden="true">→</em>
      </button>
    `;
  }

  function makePackPlanSlot(plan, slotIndex = 0) {
    const defaults = [
      { title: "Coastline Plan", desc: "3 shots cinematic coastline drone sequence.", time: 15, shots: 3, difficulty: "Intermediate" },
      { title: "Hike With Friends", desc: "Simple travel sequence with people and landscape.", time: 17, shots: 4, difficulty: "Basic" },
      { title: "Modern Home Tour", desc: "Clean exterior flow for a property video.", time: 14, shots: 4, difficulty: "Basic" },
      { title: "Sunset Cityscape", desc: "Warm urban sequence with wide establishing shots.", time: 16, shots: 4, difficulty: "Intermediate" },
      { title: "Luxury Villa", desc: "Elegant property sequence with smooth reveals.", time: 18, shots: 5, difficulty: "Intermediate" }
    ];

    const fallback = defaults[slotIndex % defaults.length];
    return {
      source: plan || null,
      title: plan?.title || fallback.title,
      desc: getPlanDescription(plan) || fallback.desc,
      cover: plan ? getPlanCover(plan) : pickThumb(filtered.find(isPlan) ? getPlanCover(filtered.find(isPlan)) : "", filtered.find((item) => !isPlan(item))?.thumb, FALLBACK_THUMB),
      shots: getPlanShots(plan) || fallback.shots,
      shootTime: getPlanShootTime(plan) || fallback.time,
      difficulty: getPlanDifficulty(plan) || fallback.difficulty,
      index: plan ? getItemFilteredIndex(plan) : -1,
      id: plan?.id || fallback.title,
      recommended: slotIndex === 0
    };
  }

  function renderPackPlanTile(planSlot, slotIndex = 0) {
    const slot = makePackPlanSlot(planSlot, slotIndex);
    const dataAttrs = slot.source
      ? `data-index="${slot.index}" data-kind="plan" data-item-id="${escapeHtml(slot.id || slot.title)}"`
      : `data-pack-placeholder-plan="${slotIndex + 1}"`;
    const featured = slotIndex === 0;

    return `
      <article class="sm-pro-pack-plan-card ${featured ? "is-featured" : ""}" ${dataAttrs}>
        <img class="sm-pro-pack-plan-card__img" src="${escapeHtml(slot.cover)}" alt="${escapeHtml(slot.title)}" loading="lazy">
        <span class="sm-pro-pack-plan-card__shade" aria-hidden="true"></span>
        ${featured ? `<span class="sm-pro-pack-plan-card__recommended">Recommended</span>` : ""}
        <div class="sm-pro-pack-plan-card__body">
          <h3>${escapeHtml(slot.title)}</h3>
          ${featured ? `<p>${escapeHtml(slot.desc)}</p>` : ""}
          <div class="sm-pro-pack-plan-card__meta">
            <span>${slot.shootTime} min</span>
            <span>${slot.shots} shots</span>
            <span class="sm-pro-plan-diff sm-pro-plan-diff--${difficultyTone(slot.difficulty)}">${escapeHtml(slot.difficulty)}</span>
          </div>
        </div>
      </article>
    `;
  }

  function renderPackPlansRail(plans) {
    const sourcePlans = Array.isArray(plans) ? plans.filter(Boolean) : [];
    const visiblePlans = Array.from({ length: 5 }, (_, index) => sourcePlans[index] || sourcePlans[index % Math.max(sourcePlans.length, 1)] || null);

    return `
      <div class="sm-pro-pack-plans-rail">
        ${visiblePlans.map((plan, index) => renderPackPlanTile(plan, index)).join("")}
      </div>
    `;
  }

  function getChecklistGroups(pack) {
    if (Array.isArray(pack?.checklistGroups) && pack.checklistGroups.length) return pack.checklistGroups;

    const items = Array.isArray(pack?.checklist) ? pack.checklist : [];
    const mistakes = Array.isArray(pack?.mistakes) ? pack.mistakes : [];
    return [
      { title: "Before the shoot", items: items.slice(0, 6) },
      { title: "During the shoot", items: items.slice(6, 11) },
      { title: "After the shoot", items: items.slice(11).concat(mistakes.slice(0, 1)) }
    ].filter((g) => Array.isArray(g.items) && g.items.length);
  }

  function renderChecklistContentOverlay(pack) {
    const groups = getChecklistGroups(pack);

    return `
      <div class="sm-pro-pack-checklist-overlay" aria-label="Checklist content">
        <div class="sm-pro-pack-checklist-titleRow">
          <span class="sm-pro-pack-checklist-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" focusable="false">
              <path d="M8.2 5.2h7.6M9.3 3.5h5.4l.75 1.7h1.1c.9 0 1.65.74 1.65 1.65v12.0c0 .9-.74 1.65-1.65 1.65H7.45c-.9 0-1.65-.74-1.65-1.65V6.85c0-.91.74-1.65 1.65-1.65h1.1l.75-1.7Z" />
              <path d="M9.2 12.2l1.55 1.55 3.95-4.25" />
            </svg>
          </span>
          <span class="sm-pro-pack-checklist-titleText">Checklist</span>
        </div>

        <div class="sm-pro-pack-checklist-line" aria-hidden="true"></div>

        <div class="sm-pro-pack-checklist-groups">
          ${groups.map((group) => `
            <section class="sm-pro-pack-checklist-group">
              <h3>${escapeHtml(group.title)}</h3>
              <div class="sm-pro-pack-checklist-items">
                ${(group.items || []).map((item) => `
                  <label class="sm-pro-pack-checklist-item">
                    <input type="checkbox" aria-label="${escapeHtml(item)}">
                    <span class="sm-pro-pack-checklist-box" aria-hidden="true"></span>
                    <span class="sm-pro-pack-checklist-copy">${escapeHtml(item)}</span>
                  </label>
                `).join("")}
              </div>
            </section>
          `).join("")}
        </div>

        <div class="sm-pro-pack-checklist-safe">Fly safe!</div>
      </div>
    `;
  }

  function renderPackChecklistSticker(pack) {
    return `
      <aside class="sm-pro-pack-sticky-checklist sm-pro-pack-sticky-checklist--svg" aria-label="Pack checklist">
        <img
          class="sm-pro-pack-checklist-paper-img"
          src="${escapeHtml(CHECKLIST_PAPER_ASSET_URL)}"
          alt=""
          loading="eager"
          decoding="async"
          draggable="false"
          aria-hidden="true"
        >
        ${renderChecklistContentOverlay(pack)}
      </aside>
    `;
  }

  function renderProPackDetailScreenDesktopV125() {
    const pack = getActivePackItem();
    if (!pack) {
      activeProPackId = null;
      activeProTab = "packs";
      setPackDetailPageMode(false);
      renderProPacksScreen();
      return;
    }

    const moves = getPackMovesForDetail(pack);
    const plans = getPackPlansForDetail(pack);
    const lessons = Array.isArray(pack.lessons) ? pack.lessons : [];
    const visibleMoves = Array.from({ length: 6 }, (_, index) => moves[index] || moves[index % Math.max(moves.length, 1)] || null);
    const hiddenMoves = Math.max(0, Number(pack.movesCount || moves.length || 0) - visibleMoves.length);

    grid.innerHTML = "";
    if (resultsHead) resultsHead.style.display = "none";
    if (moreBtn) moreBtn.style.display = "none";
    scope.classList.add("sm-pro-subscreen", "sm-pro-pack-detail-active");
    setPackDetailPageMode(true);

    const wrap = document.createElement("div");
    wrap.className = "sm-pro-pack-detail-screen sm-pro-tab-screen";
    wrap.innerHTML = `
      <div class="sm-pro-pack-bg" aria-hidden="true">
        <img src="${escapeHtml(pack.thumb || FALLBACK_THUMB)}" alt="" loading="eager" decoding="async">
      </div>

      <main class="sm-pro-pack-main">
        <section class="sm-pro-pack-hero-copy">
          <button class="sm-pro-pack-back" type="button" aria-label="Back to library" data-pro-go-tab="all">‹</button>
          <h1>${escapeHtml(pack.title)}</h1>
          <p class="sm-pro-pack-powered">powered by <strong>${escapeHtml(pack.creator || "SkyMotion")}</strong></p>
          <p class="sm-pro-pack-description">${escapeHtml(pack.description || "A ready-to-use shooting workflow for this situation.")}</p>
          <div class="sm-pro-pack-stats" aria-label="Pack contents">
            <span>${Number(pack.movesCount || moves.length || 0)} moves</span>
            <span>${Number(pack.plansCount || plans.length || 0)} plans</span>
            <span>Checklist</span>
          </div>
        </section>

        <section class="sm-pro-pack-section sm-pro-pack-section--start">
          <div class="sm-pro-pack-section-head"><h2>Start here</h2></div>
          <div class="sm-pro-pack-lessons">
            ${lessons.map(renderPackLessonCard).join("")}
          </div>
        </section>

        <button class="sm-pro-pack-checklist-card" type="button" data-pro-open-checklist="1">
          <span class="sm-pro-pack-checklist-icon" aria-hidden="true">✓</span>
          <span>
            <strong>${escapeHtml(pack.checklistTitle || "Open checklist")}</strong>
            <small>Everything you need before and during the shoot.</small>
          </span>
          <em aria-hidden="true">›</em>
        </button>

        <section class="sm-pro-pack-section sm-pro-pack-section--plans">
          <div class="sm-pro-pack-section-head"><h2>Plans in this pack</h2></div>
          ${renderPackPlansRail(plans)}
        </section>

        <section class="sm-pro-pack-section sm-pro-pack-section--moves">
          <div class="sm-pro-pack-section-head"><h2>Moves in this pack</h2></div>
          <div class="sm-pro-pack-move-row">
            ${visibleMoves.map((move, index) => renderPackMoveTile(move, index)).join("")}
            ${renderPackMoreMovesCard(hiddenMoves)}
          </div>
        </section>

        <footer class="sm-pro-pack-footer" aria-label="SkyMotion signature">
          Learn. Create. Elevate.
        </footer>
      </main>

      ${renderPackChecklistSticker(pack)}
    `;

    grid.appendChild(wrap);
    attachImgFallback(wrap);
    safeText(matchCount, String(moves.length + plans.length));
  }

  function renderProPackDetailScreenMobileV25() {
    const pack = getActivePackItem();
    if (!pack) {
      activeProPackId = null;
      activeProTab = "packs";
      renderProPacksScreen();
      return;
    }

    const moves = getPackMovesForDetail(pack);
    const plans = getPackPlansForDetail(pack);
    const lessons = Array.isArray(pack.lessons) ? pack.lessons : [];

    grid.innerHTML = "";
    if (resultsHead) resultsHead.style.display = "none";
    if (moreBtn) moreBtn.style.display = "none";
    scope.classList.add("sm-pro-subscreen", "sm-pro-pack-detail-active");
    setPackDetailPageMode(true);

    const wrap = document.createElement("div");
    wrap.className = "sm-pro-pack-detail-screen sm-pro-tab-screen";
    wrap.innerHTML = `
      <section class="sm-pro-pack-detail-hero-v2">
        <img src="${escapeHtml(pack.thumb || FALLBACK_THUMB)}" alt="${escapeHtml(pack.title)}" loading="lazy">
        <div class="sm-pro-pack-detail-hero-v2__shade"></div>
        <button class="sm-pro-pack-detail-back" type="button" aria-label="Back to packs" data-pro-go-tab="packs">‹</button>

        <div class="sm-pro-pack-detail-hero-v2__content">
          <h1>${escapeHtml(pack.title)}</h1>
          <p class="sm-pro-pack-powered">powered by <strong>${escapeHtml(pack.creator || "SkyMotion")}</strong></p>
          <p class="sm-pro-pack-description">${escapeHtml(pack.description || "A ready-to-use shooting workflow for this situation.")}</p>

          <div class="sm-pro-pack-stats" aria-label="Pack contents">
            <span>${Number(pack.movesCount || moves.length || 0)} moves</span>
            <span>${Number(pack.plansCount || plans.length || 0)} plans</span>
            <span>Checklist</span>
          </div>
        </div>
      </section>

      <section class="sm-pro-pack-section">
        <div class="sm-pro-pack-section-head">
          <h2>Start here</h2>
        </div>
        <div class="sm-pro-pack-lessons">
          ${lessons.map(renderPackLessonCard).join("")}
        </div>
      </section>

      <button class="sm-pro-pack-checklist-card" type="button" data-pro-open-checklist="1">
        <span class="sm-pro-pack-checklist-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round">
            <rect x="6" y="4.75" width="12" height="16" rx="2.2"/>
            <path d="M9.25 4.75V3.8c0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1v.95"/>
            <path d="m9 11.2 1.7 1.7 3.6-3.8"/>
            <path d="M9 16h6"/>
          </svg>
        </span>
        <span>
          <strong>${escapeHtml(pack.checklistTitle || "Open checklist")}</strong>
          <small>Everything you need to check before and during the shoot.</small>
        </span>
        <em aria-hidden="true">›</em>
      </button>

      <section class="sm-pro-pack-section">
        <div class="sm-pro-pack-section-head">
          <h2>Plans in this pack</h2>
          <button type="button" data-pro-go-tab="plans">View all</button>
        </div>
        ${renderPackPlansRail(plans)}
      </section>

      <section class="sm-pro-pack-section">
        <div class="sm-pro-pack-section-head">
          <h2>Moves in this pack</h2>
          <button type="button" data-pro-go-tab="moves">View all</button>
        </div>
        <div class="sm-pro-pack-move-row">
          ${moves.slice(0, 13).map(renderPackMoveTile).join("")}
        </div>
      </section>

      <footer class="sm-pro-pack-footer" aria-label="SkyMotion signature">
        Learn. Create. Elevate.
      </footer>
    `;

    grid.appendChild(wrap);
    attachImgFallback(wrap);
    safeText(matchCount, String(moves.length + plans.length));
  }

  function renderProPackDetailScreen() {
    if (isProMobilePortrait()) {
      return renderProPackDetailScreenMobileV25();
    }

    return renderProPackDetailScreenDesktopV125();
  }

  function openProChecklist(pack) {
    const current = pack || getActivePackItem();
    if (!current) return;

    const sheet = document.createElement("div");
    sheet.className = "sm-pro-checklist-sheet sm-pro-checklist-sheet--svg";
    sheet.setAttribute("role", "dialog");
    sheet.setAttribute("aria-modal", "true");
    sheet.innerHTML = `
      <div class="sm-pro-checklist-sheet__backdrop" data-pro-close-checklist="1"></div>
      <div class="sm-pro-checklist-sheet__panel sm-pro-checklist-sheet__panel--svg">
        <button class="sm-pro-checklist-sheet__close" type="button" aria-label="Close checklist" data-pro-close-checklist="1">×</button>
        <img
          class="sm-pro-pack-checklist-paper-img"
          src="${escapeHtml(CHECKLIST_PAPER_ASSET_URL)}"
          alt=""
          loading="eager"
          decoding="async"
          draggable="false"
          aria-hidden="true"
        >
        ${renderChecklistContentOverlay(current)}
      </div>
    `;

    document.body.appendChild(sheet);
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    requestAnimationFrame(() => sheet.classList.add("is-open"));
  }

  function closeProChecklist() {
    const sheet = document.querySelector(".sm-pro-checklist-sheet");
    if (!sheet) return;
    sheet.classList.remove("is-open");
    setTimeout(() => sheet.remove(), 180);
    document.documentElement.style.overflow = "";
    document.body.style.overflow = "";
  }

  function renderProPacksScreen() {
    const { allPacks, packs } = getProPacksData();
    const wrap = renderProScreenShell("Packs");
    wrap.classList.add("sm-pro-packs-screen");

    renderProSearchBar(wrap);
    renderProCountRow(wrap, getProPacksCountLabel(packs, allPacks), "Search packs");

    const list = document.createElement("div");
    list.className = "sm-pro-pack-list";
    list.setAttribute("data-pro-pack-list", "1");
    wrap.appendChild(list);

    if (!packs.length) {
      renderProEmpty(wrap, "No packs found", proSearchQuery ? "No pack title matches this search." : "Packs will appear here as the Pro library grows.");
      safeText(matchCount, "0");
      return;
    }

    packs.forEach((pack) => list.appendChild(renderPackListCard(pack)));
    attachImgFallback(wrap);
    safeText(matchCount, String(packs.length));
  }

  function updateProPacksLive() {
    if ((!isProMobilePortrait() && !isProDesktopLayout()) || activeProTab !== "packs") return;
    const wrap = scope.querySelector(".sm-pro-packs-screen");
    if (!wrap) return;
    const { allPacks, packs } = getProPacksData();
    setProCount(wrap, getProPacksCountLabel(packs, allPacks));
    const list = wrap.querySelector("[data-pro-pack-list]");
    const oldEmpty = wrap.querySelector(".sm-pro-empty");
    if (!list) return;
    list.innerHTML = "";
    if (oldEmpty) oldEmpty.remove();
    if (!packs.length) {
      renderProEmpty(wrap, "No packs found", proSearchQuery ? "No pack title matches this search." : "Packs will appear here as the Pro library grows.");
      safeText(matchCount, "0");
      return;
    }
    packs.forEach((pack) => list.appendChild(renderPackListCard(pack)));
    attachImgFallback(wrap);
    safeText(matchCount, String(packs.length));
  }

  function getProSavedData() {
    const allSavedMoves = filtered.filter((item) => !isPlan(item) && isSaved(getVideoId(item)));
    const savedMoves = filterByTitleOnly(allSavedMoves);

    const allSavedPacks = getProPackItems().filter((pack) => isGenericSaved("pack", pack?.id));
    const q = normalizeSearchText(proSearchQuery);
    const savedPacks = q
      ? allSavedPacks.filter((pack) => normalizeSearchText(pack?.title || "").includes(q))
      : allSavedPacks;

    return { allSavedMoves, savedMoves, allSavedPacks, savedPacks };
  }

  function getProSavedCountLabel(data) {
    const savedCount = (data?.savedMoves?.length || 0) + (data?.savedPacks?.length || 0);
    const totalCount = (data?.allSavedMoves?.length || 0) + (data?.allSavedPacks?.length || 0);
    return proSearchQuery ? `${savedCount} found · ${totalCount} saved` : `${savedCount}/${totalCount} saved`;
  }

  function renderProSavedScreen() {
    const savedData = getProSavedData();
    const { savedPacks, savedMoves, allSavedPacks, allSavedMoves } = savedData;
    const wrap = renderProScreenShell("Saved");
    wrap.classList.add("sm-pro-saved-screen");

    renderProSearchBar(wrap);
    renderProCountRow(wrap, getProSavedCountLabel(savedData), "Search saved items");

    const hasAny = savedPacks.length || savedMoves.length;
    const totalAny = allSavedPacks.length || allSavedMoves.length;

    if (!hasAny) {
      renderProEmpty(
        wrap,
        totalAny ? "No saved items found" : "No saved items yet",
        totalAny ? "No saved item title matches this search." : "Save useful moves or packs and they will appear here."
      );
      safeText(matchCount, "0");
      return;
    }

    if (savedPacks.length) {
      const packTitle = document.createElement("div");
      packTitle.className = "sm-pro-saved-subtitle";
      packTitle.textContent = "Saved packs";
      wrap.appendChild(packTitle);

      const packList = document.createElement("div");
      packList.className = "sm-pro-pack-list sm-pro-saved-pack-list";
      packList.setAttribute("data-pro-saved-pack-list", "1");
      wrap.appendChild(packList);
      savedPacks.forEach((pack) => packList.appendChild(renderPackListCard(pack)));
    }

    if (savedMoves.length) {
      const movesTitle = document.createElement("div");
      movesTitle.className = "sm-pro-saved-subtitle";
      movesTitle.textContent = "Saved moves";
      wrap.appendChild(movesTitle);

      const list = document.createElement("div");
      list.className = "sm-pro-move-list";
      list.setAttribute("data-pro-saved-list", "1");
      wrap.appendChild(list);

      savedMoves.forEach((item) => {
        const idx = getItemFilteredIndex(item);
        list.appendChild(renderMoveListCard(item, idx));
      });
    }

    attachImgFallback(wrap);
    safeText(matchCount, String(savedPacks.length + savedMoves.length));
  }

  function updateProSavedLive() {
    if ((!isProMobilePortrait() && !isProDesktopLayout()) || activeProTab !== "saved") return;
    renderProSavedScreen();
  }


  function renderFeaturedPackCard(plans = [], moves = []) {
    const pack = getProPackItems()[0];
    const movesCount = Number(pack?.movesCount || 10);
    const plansCount = Number(pack?.plansCount || 3);

    // Desktop home must use the new black Promo Real Estate card.
    // Mobile home and the Packs tab keep the existing card behavior.
    if (activeProTab === "all" && isProDesktopLayout()) {
      const title = "Promo Real Estate Pack";
      const badge = "BY DOMINIC HAYLES";
      const line = "For paid property shoots · 30–60s property reel · 5 hero shots";

      return `
        <article class="sm-pro-pack-card sm-pro-pack-card--home-promo-real-estate" data-pro-pack="${escapeHtml(pack.id)}">
          <img class="sm-pro-pack-img" src="${escapeHtml(pack.thumb || FALLBACK_THUMB)}" alt="${escapeHtml(title)}" loading="lazy">
          <div class="sm-pro-pack-shade"></div>

          <div class="sm-pro-pack-content">
            <span class="sm-pro-pack-badge">${escapeHtml(badge)}</span>
            <h3>${escapeHtml(title)}</h3>
            <div class="sm-pro-pack-meta">
              <span>${movesCount} moves</span>
              <span>${plansCount} plans</span>
              <span>Checklist</span>
            </div>
            <p>${escapeHtml(line)}</p>
          </div>

          <button class="sm-pro-pack-save ${isGenericSaved("pack", pack.id) ? "isSaved" : ""}" type="button" aria-label="${isGenericSaved("pack", pack.id) ? "Unsave pack" : "Save pack"}" data-pro-pack-save="${escapeHtml(pack.id)}">
            ${bookmarkSvg()}
          </button>
        </article>
      `;
    }

    return `
      <article class="sm-pro-pack-card" data-pro-pack="${escapeHtml(pack.id)}">
        <img class="sm-pro-pack-img" src="${escapeHtml(pack.thumb || FALLBACK_THUMB)}" alt="${escapeHtml(pack.title)}" loading="lazy">
        <div class="sm-pro-pack-shade"></div>

        <div class="sm-pro-pack-content">
          <span class="sm-pro-pack-badge">POWERED BY ${escapeHtml(pack.creator || "SkyMotion")}</span>
          <h3>${escapeHtml(pack.title)}</h3>
          <div class="sm-pro-pack-meta">
            <span>${movesCount} moves</span>
            <span>${plansCount} plans</span>
            <span>Checklist</span>
          </div>
          <p>${escapeHtml((pack.bestFor || []).length ? `Best for: ${pack.bestFor.join(", ")}` : pack.description)}</p>
        </div>

        <button class="sm-pro-pack-save ${isGenericSaved("pack", pack.id) ? "isSaved" : ""}" type="button" aria-label="${isGenericSaved("pack", pack.id) ? "Unsave pack" : "Save pack"}" data-pro-pack-save="${escapeHtml(pack.id)}">
          ${bookmarkSvg()}
        </button>
      </article>
    `;
  }


  // Home preview: a few free moves + a couple locked previews. Order stays free-first
  // (no reorder); the free region mirrors the gating free-set (first 7 moves).
  const HOME_FREE_MOVES = 7;
  function homeMovePreview(moves, freeN, lockedN) {
    const free = moves.slice(0, HOME_FREE_MOVES).slice(0, freeN);
    const locked = moves.slice(HOME_FREE_MOVES, HOME_FREE_MOVES + lockedN);
    return free.concat(locked);
  }

  function renderProMobileHome() {
    grid.innerHTML = "";

    const plans = filtered.filter(isPlan);
    const moves = filtered.filter((item) => !isPlan(item));

    if (!filtered.length) {
      grid.innerHTML = `<div class="card" style="padding:14px">No results.</div>`;
      if (moreBtn) moreBtn.style.display = "none";
      safeText(matchCount, "0");
      if (resultsHead) resultsHead.style.display = "none";
      updateFilterUi();
      return;
    }

    if (resultsHead) resultsHead.style.display = "none";
    if (moreBtn) moreBtn.style.display = "none";

    const frag = document.createDocumentFragment();
    const wrap = document.createElement("div");
    wrap.className = "sm-pro-mobile-home";

    const popularMoves = homeMovePreview(moves, 3, 1);   // mobile: 3 free + 1 locked
    const cinematicPlans = plans.slice(0, 3);            // 2 free + 1 locked

    wrap.innerHTML = `
      <section class="sm-pro-section sm-pro-section--pack">
        ${renderSectionHeader("Featured pack", "View all", "packs")}
        ${renderFeaturedPackCard(plans, moves)}
      </section>

      <section class="sm-pro-section sm-pro-section--moves">
        ${renderSectionHeader("Popular moves", "View all", "moves")}
        <div class="sm-pro-card-grid sm-pro-card-grid--moves" data-pro-section="moves"></div>
      </section>

      <section class="sm-pro-section sm-pro-section--plans">
        ${renderSectionHeader("Cinematic plans", "View all", "plans")}
        <div class="sm-pro-card-grid sm-pro-card-grid--plans" data-pro-section="plans"></div>
      </section>
    `;

    const movesGrid = wrap.querySelector('[data-pro-section="moves"]');
    const plansGrid = wrap.querySelector('[data-pro-section="plans"]');

    popularMoves.forEach((item) => {
      const idx = getItemFilteredIndex(item);
      movesGrid.appendChild(renderMoveCard(item, idx));
    });

    cinematicPlans.forEach((item) => {
      const idx = getItemFilteredIndex(item);
      plansGrid.appendChild(renderPlanCard(item, idx));
    });

    frag.appendChild(wrap);
    grid.appendChild(frag);
    attachImgFallback(grid);

    safeText(matchCount, String(filtered.length));
  }

  function renderProDesktopHome() {
    grid.innerHTML = "";
    grid.classList.add("sm-pro-desktop-home-grid");

    const plans = filtered.filter(isPlan);
    const moves = filtered.filter((item) => !isPlan(item));

    if (!filtered.length) {
      grid.innerHTML = `<div class="card" style="padding:14px">No results.</div>`;
      if (moreBtn) moreBtn.style.display = "none";
      safeText(matchCount, "0");
      if (resultsHead) resultsHead.style.display = "none";
      updateFilterUi();
      return;
    }

    if (resultsHead) resultsHead.style.display = "none";
    if (moreBtn) moreBtn.style.display = "none";

    const wrap = document.createElement("div");
    wrap.className = "sm-pro-desktop-home";

    const planCards = plans.slice(0, 3).map((item) => {   // 2 free + 1 locked
      const idx = getItemFilteredIndex(item);
      const card = renderPlanCard(item, idx);
      return card.outerHTML;
    }).join("");

    wrap.innerHTML = `
      <div class="sm-pro-desktop-primary">
        <section class="sm-pro-section sm-pro-section--pack sm-pro-desktop-panel sm-pro-desktop-panel--pack">
          ${renderSectionHeader("Featured pack", "View all", "packs")}
          ${renderFeaturedPackCard(plans, moves)}
        </section>

        <section class="sm-pro-section sm-pro-section--plans sm-pro-desktop-panel sm-pro-desktop-panel--plans">
          ${renderSectionHeader("Cinematic plans", "View all", "plans")}
          <div class="sm-pro-desktop-plan-grid" data-pro-desktop-section="plans">${planCards}</div>
        </section>
      </div>

      <aside class="sm-pro-desktop-side">
        <section class="sm-pro-section sm-pro-section--moves sm-pro-desktop-panel sm-pro-desktop-panel--moves">
          ${renderSectionHeader("Popular moves", "View all", "moves")}
          <div class="sm-pro-desktop-move-stack" data-pro-desktop-section="moves"></div>
        </section>
      </aside>
    `;

    const moveStack = wrap.querySelector('[data-pro-desktop-section="moves"]');
    homeMovePreview(moves, 5, 2).forEach((item) => {   // desktop: 5 free + 2 locked
      const idx = getItemFilteredIndex(item);
      moveStack.appendChild(renderMoveCard(item, idx));
    });

    grid.appendChild(wrap);
    attachImgFallback(grid);
    safeText(matchCount, String(filtered.length));
  }

  function renderResults() {
    if (isInitialLoading) return;

    setupProTabs();
    grid.classList.remove("sm-pro-desktop-home-grid");

    if (isProMobilePortrait()) {
      if (activeProPackId) {
        renderProPackDetailScreen();
        return;
      }

      scope.classList.remove("sm-pro-pack-detail-active");
      setPackDetailPageMode(false);

      if (activeProTab === "moves") {
        renderProMovesScreen();
      } else if (activeProTab === "plans") {
        renderProPlansScreen();
      } else if (activeProTab === "packs") {
        renderProPacksScreen();
      } else if (activeProTab === "saved") {
        renderProSavedScreen();
      } else {
        renderProMobileHome();
      }
      return;
    }

    if (isProDesktopLayout()) {
      if (activeProPackId) {
        renderProPackDetailScreen();
        return;
      }

      scope.classList.remove("sm-pro-pack-detail-active");
      setPackDetailPageMode(false);

      if (activeProTab === "moves") {
        renderProMovesScreen();
      } else if (activeProTab === "plans") {
        renderProPlansScreen();
      } else if (activeProTab === "packs") {
        renderProPacksScreen();
      } else if (activeProTab === "saved") {
        renderProSavedScreen();
      } else {
        renderProDesktopHome();
      }
      return;
    }

    scope.classList.remove("sm-pro-pack-detail-active");
    setPackDetailPageMode(false);

    grid.innerHTML = "";
    const slice = filtered.slice(0, visibleCount);

    if (!slice.length) {
      grid.innerHTML = `<div class="card" style="padding:14px">No results.</div>`;
      if (moreBtn) moreBtn.style.display = "none";
      safeText(matchCount, "0");
      if (resultsHead) resultsHead.style.display = "none";
      updateFilterUi();
      return;
    }

    const hasAnyPlan = slice.some(isPlan);
    if (resultsHead) resultsHead.style.display = hasAnyPlan ? "flex" : "none";

    slice.forEach((item, i) => {
      const card = isPlan(item) ? renderPlanCard(item, i) : renderMoveCard(item, i);
      grid.appendChild(card);
    });

    attachImgFallback(grid);

    if (moreBtn) {
      moreBtn.style.display = filtered.length > visibleCount ? "block" : "none";
    }

    safeText(matchCount, String(filtered.length));
  }

  if (moreBtn) {
    moreBtn.addEventListener("click", () => {
      visibleCount += 12;
      renderResults();
    });
  }

  let smRenderResizeTimer = null;
  window.addEventListener("resize", () => {
    if (isInitialLoading) return;
    clearTimeout(smRenderResizeTimer);
    smRenderResizeTimer = setTimeout(() => renderResults(), 120);
  });

  window.addEventListener("orientationchange", () => {
    if (isInitialLoading) return;
    setTimeout(() => renderResults(), 180);
  });

  function buildVideoPlayer(video) {
    const src = normalizeUrl(video?.videoUrl || video?.video_url);

    modalContent.innerHTML = `
      <div class="player">
        <div class="player__top">
          <div class="player__title">${escapeHtml(video?.title || "")}</div>
          <button class="player__close" id="playerClose" type="button" aria-label="Close">×</button>
        </div>

        <div class="player__videoWrap">
          <video id="playerVideo" playsinline preload="metadata">
            <source src="${escapeHtml(src)}" type="video/mp4">
          </video>

          <div class="player__rotateHint" id="rotateHint" aria-hidden="true">
            Rotate phone for better view
          </div>

          <div class="player__controls" id="playerControls">
            <div class="player__progressWrap">
              <input id="playerSeek" class="player__seek" type="range" min="0" max="100" step="0.1" value="0" aria-label="Video progress">
            </div>

            <div class="player__bar">
              <div class="player__barLeft">
                <button class="btn" id="playPauseBtn" type="button">Pause</button>
                <div class="player__time" id="playerTime">0:00 / 0:00</div>
              </div>

              <div class="player__barCenter">
                <button class="btn" id="prevVideoBtn" type="button">Prev</button>
                <button class="btn" id="nextVideoBtn" type="button">Next</button>
              </div>

              <div class="player__barRight">
                <button class="btn" id="fsBtn" type="button">Fullscreen</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function bindPlayerUi({
    player,
    playPauseBtn,
    playerSeek,
    playerTime,
    closeBtn,
    prevBtn,
    nextBtn,
    fsBtn,
    videoWrap,
    controls,
    onPrev,
    onNext,
    onClose,
    analyticsId,
    analyticsTitle
  }) {
    let startedTracked = false;
    let watched50Tracked = false;
    let isSeeking = false;

    function updateTimeUi() {
      if (!player || !playerTime || !playerSeek) return;

      const duration = Number(player.duration || 0);
      const current = Number(player.currentTime || 0);

      playerTime.textContent = `${formatPlayerTime(current)} / ${formatPlayerTime(duration)}`;

      if (!isSeeking) {
        const progress = duration > 0 ? (current / duration) * 100 : 0;
        playerSeek.value = String(progress);
      }
    }

    function updatePlayPauseUi() {
      if (!playPauseBtn || !player) return;
      playPauseBtn.textContent = player.paused ? "Play" : "Pause";
    }

    const onPlay = () => {
      updatePlayPauseUi();

      if (startedTracked) return;
      startedTracked = true;

      emit("sm:video_started", {
        item_id: analyticsId,
        item_type: "move",
        title: analyticsTitle
      });
    };

    const onPause = () => updatePlayPauseUi();

    const onTimeUpdate = () => {
      updateTimeUi();

      if (watched50Tracked) return;

      const duration = Number(player.duration || 0);
      const current = Number(player.currentTime || 0);
      if (!duration || duration <= 0) return;

      if (current / duration >= 0.5) {
        watched50Tracked = true;

        emit("sm:video_watched_50", {
          item_id: analyticsId,
          item_type: "move",
          title: analyticsTitle
        });
      }
    };

    const onEnded = () => {
      updatePlayPauseUi();
      updateTimeUi();
    };

    player?.addEventListener("play", onPlay);
    player?.addEventListener("pause", onPause);
    player?.addEventListener("loadedmetadata", updateTimeUi);
    player?.addEventListener("timeupdate", onTimeUpdate);
    player?.addEventListener("ended", onEnded);

    if (closeBtn) closeBtn.addEventListener("click", onClose);
    if (prevBtn && onPrev) prevBtn.addEventListener("click", onPrev);
    if (nextBtn && onNext) nextBtn.addEventListener("click", onNext);

    if (playPauseBtn) {
      playPauseBtn.addEventListener("click", () => {
        togglePlayerPlayback(player, playPauseBtn);
      });
    }

    if (playerSeek && player) {
      playerSeek.addEventListener("pointerdown", () => {
        isSeeking = true;
      });

      playerSeek.addEventListener("pointerup", () => {
        const duration = Number(player.duration || 0);
        const value = Number(playerSeek.value || 0);

        if (duration > 0) {
          player.currentTime = (value / 100) * duration;
        }

        isSeeking = false;
        updateTimeUi();
      });

      playerSeek.addEventListener("input", () => {
        const duration = Number(player.duration || 0);
        const value = Number(playerSeek.value || 0);
        const previewTime = duration > 0 ? (value / 100) * duration : 0;

        if (playerTime) {
          playerTime.textContent = `${formatPlayerTime(previewTime)} / ${formatPlayerTime(duration)}`;
        }
      });

      playerSeek.addEventListener("change", () => {
        const duration = Number(player.duration || 0);
        const value = Number(playerSeek.value || 0);

        if (duration > 0) {
          player.currentTime = (value / 100) * duration;
        }

        isSeeking = false;
        updateTimeUi();
      });
    }

    const onVideoTap = (e) => {
      const target = e.target;
      if (!player) return;

      if (controls && controls.contains(target)) return;
      if (target.closest(".player__top")) return;
      if (target.closest(".player__rotateHint")) return;

      togglePlayerPlayback(player, playPauseBtn);
    };

    if (videoWrap) {
      videoWrap.addEventListener("click", onVideoTap);
    }

    const removeFsBindings = bindFullscreenState(player);
    const removeRotateHintBindings = bindRotateHint();

    if (fsBtn) {
      fsBtn.addEventListener("click", async () => {
        if (isElementFullscreen(modal)) {
          await exitPlayerFullscreen();
        } else {
          await enterPlayerFullscreen(player);
        }
      });
    }

    if (player) {
      player.play().catch(() => {});
      updatePlayPauseUi();
      updateTimeUi();
    }

    return () => {
      try { player?.pause(); } catch (_) {}

      if (videoWrap) {
        videoWrap.removeEventListener("click", onVideoTap);
      }

      player?.removeEventListener("play", onPlay);
      player?.removeEventListener("pause", onPause);
      player?.removeEventListener("loadedmetadata", updateTimeUi);
      player?.removeEventListener("timeupdate", onTimeUpdate);
      player?.removeEventListener("ended", onEnded);

      if (removeFsBindings) removeFsBindings();
      if (removeRotateHintBindings) removeRotateHintBindings();

      setFsUiHidden(false);
    };
  }

  async function openPlayer(index, options = {}) {
    if (!filtered.length) return;

    const preservePlanReturn = options.preservePlanReturn === true;
    returnToPlanAfterClose = preservePlanReturn ? true : false;

    const item = filtered[index];
    if (!item || isPlan(item)) return;

    try { modal._cleanup && modal._cleanup(); } catch (_) {}
    modal._cleanup = null;

    currentIndex = index;
    const video = filtered[currentIndex];
    const src = normalizeUrl(video?.videoUrl || video?.video_url);
    if (!src) return;

    emit("sm:move_opened", {
      item_id: getVideoId(video),
      item_type: "move",
      title: video?.title || "",
      cover: pickThumb(video?.thumb),
      meta: [video?.duration || formatSeconds(video?.duration_s), getMoveDifficulty(video)].filter(Boolean).join(" · ")
    });

    buildVideoPlayer(video);

    window.scrollTo(0, 0);
    setPlayerViewportHeight();
    setModal(true);

    const player = $("playerVideo");
    const closeBtn = $("playerClose");
    const prevBtn = $("prevVideoBtn");
    const nextBtn = $("nextVideoBtn");
    const fsBtn = $("fsBtn");
    const playPauseBtn = $("playPauseBtn");
    const playerSeek = $("playerSeek");
    const playerTime = $("playerTime");
    const videoWrap = player?.closest(".player__videoWrap");
    const controls = $("playerControls");

    const goPrev = () => {
      for (let i = currentIndex - 1; i >= 0; i--) {
        if (!isPlan(filtered[i])) {
          return openPlayer(i, { preservePlanReturn: returnToPlanAfterClose === true });
        }
      }
    };

    const goNext = () => {
      for (let i = currentIndex + 1; i < filtered.length; i++) {
        if (!isPlan(filtered[i])) {
          return openPlayer(i, { preservePlanReturn: returnToPlanAfterClose === true });
        }
      }
    };

    const onBackdrop = () => closeModal();
    modalBackdrop.addEventListener("click", onBackdrop);

    const playerCleanup = bindPlayerUi({
      player,
      playPauseBtn,
      playerSeek,
      playerTime,
      closeBtn,
      prevBtn,
      nextBtn,
      fsBtn,
      videoWrap,
      controls,
      onPrev: goPrev,
      onNext: goNext,
      onClose: closeModal,
      analyticsId: getVideoId(video),
      analyticsTitle: video?.title || ""
    });

    modal._cleanup = () => {
      modalBackdrop.removeEventListener("click", onBackdrop);
      playerCleanup();
    };
  }

  window.addEventListener("sm:open-move-player", (e) => {
    returnToPlanAfterClose = true;

    const move = e.detail?.move;
    if (!move) return;

    const directUrl = normalizeUrl(move?.videoUrl || move?.video_url || "");
    if (!directUrl) return;

    const idx = filtered.findIndex((x) => !isPlan(x) && String(getVideoId(x)) === String(getVideoId(move)));

    if (idx >= 0) {
      openPlayer(idx, { preservePlanReturn: true });
      return;
    }

    try { modal._cleanup && modal._cleanup(); } catch (_) {}
    modal._cleanup = null;

    emit("sm:move_opened", {
      item_id: getVideoId(move),
      item_type: "move",
      title: move?.title || "Move video",
      cover: pickThumb(move?.thumb),
      meta: [move?.duration || formatSeconds(move?.duration_s), getMoveDifficulty(move)].filter(Boolean).join(" · ")
    });

    buildVideoPlayer({
      id: move?.id || directUrl,
      title: move?.title || "Move video",
      videoUrl: directUrl,
      video_url: directUrl,
      thumb: move?.thumb || FALLBACK_THUMB,
      duration: move?.duration || ""
    });

    window.scrollTo(0, 0);
    setPlayerViewportHeight();
    setModal(true);

    const player = $("playerVideo");
    const closeBtn = $("playerClose");
    const prevBtn = $("prevVideoBtn");
    const nextBtn = $("nextVideoBtn");
    const fsBtn = $("fsBtn");
    const playPauseBtn = $("playPauseBtn");
    const playerSeek = $("playerSeek");
    const playerTime = $("playerTime");
    const videoWrap = player?.closest(".player__videoWrap");
    const controls = $("playerControls");

    if (prevBtn) prevBtn.style.display = "none";
    if (nextBtn) nextBtn.style.display = "none";

    const onBackdrop = () => closeModal();
    modalBackdrop.addEventListener("click", onBackdrop);

    const playerCleanup = bindPlayerUi({
      player,
      playPauseBtn,
      playerSeek,
      playerTime,
      closeBtn,
      prevBtn,
      nextBtn,
      fsBtn,
      videoWrap,
      controls,
      onPrev: null,
      onNext: null,
      onClose: closeModal,
      analyticsId: getVideoId(move),
      analyticsTitle: move?.title || "Move video"
    });

    modal._cleanup = () => {
      modalBackdrop.removeEventListener("click", onBackdrop);
      playerCleanup();
    };
  });

  function findMoveForSave(saveId, sourceCard = null) {
    const id = String(saveId || "");
    if (!id) return null;

    const fromCard = getLibraryItemFromCard(sourceCard);
    if (fromCard && !isPlan(fromCard) && String(getVideoId(fromCard)) === id) return fromCard;

    return (
      filtered.find((item) => !isPlan(item) && String(getVideoId(item)) === id) ||
      allItems.find((item) => !isPlan(item) && String(getVideoId(item)) === id) ||
      savedCache.find((item) => String(item?.id || item?.video_id || item?.slug || item?.videoUrl || item?.video_url || "") === id) ||
      null
    );
  }

  function setMoveSaveUi(id, saved) {
    const key = String(id || "");
    if (!key) return;

    scope.querySelectorAll(`[data-save-id="${CSS.escape(key)}"]`).forEach((btn) => {
      btn.classList.toggle("isSaved", !!saved);
      btn.setAttribute("aria-label", saved ? "Unsave" : "Save");
      btn.disabled = false;
      btn.removeAttribute("aria-busy");
    });
  }

  function setPackSaveUi(id, saved) {
    const key = String(id || "");
    if (!key) return;

    scope.querySelectorAll(`[data-pro-pack-save="${CSS.escape(key)}"]`).forEach((btn) => {
      btn.classList.toggle("isSaved", !!saved);
      btn.setAttribute("aria-label", saved ? "Unsave pack" : "Save pack");
      btn.disabled = false;
      btn.removeAttribute("aria-busy");
    });
  }

  function refreshSaveDependentViews() {
    if (activeProTab === "saved") {
      renderResults();
      return;
    }

    if (activeProTab === "moves") {
      if (activeMoveLevel === "saved") renderResults();
      else updateProMovesLive();
    }
  }

  grid.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-open-pro-filters]");
    if (!btn) return;
    e.preventDefault();
    e.stopPropagation();
    openAssistant();
  });

  grid.addEventListener("click", async (e) => {
    const tabBtn = e.target.closest("[data-pro-go-tab]");
    if (tabBtn) {
      switchProTabFromButton(e);
      return;
    }

    const searchBtn = e.target.closest("[data-pro-toggle-search]");
    if (searchBtn) {
      e.preventDefault();
      e.stopPropagation();
      toggleProSearch();
      return;
    }

    const checklistBtn = e.target.closest("[data-pro-open-checklist]");
    if (checklistBtn) {
      e.preventDefault();
      e.stopPropagation();
      openProChecklist();
      return;
    }

    const packSaveBtn = e.target.closest(".sm-pro-pack-save");
    if (packSaveBtn) {
      e.preventDefault();
      e.stopPropagation();

      const packId = packSaveBtn.dataset.proPackSave || packSaveBtn.closest("[data-pro-pack]")?.dataset.proPack || activeProPackId;
      const pack = getProPackItems().find((item) => String(item?.id) === String(packId));
      if (!pack) return;

      const nowSaved = toggleSavedPack(pack);
      setPackSaveUi(pack.id, nowSaved);
      if (activeProTab === "saved") renderResults();
      return;
    }

    const directSaveBtn = e.target.closest(".sm-save");
    if (directSaveBtn) {
      e.preventDefault();
      e.stopPropagation();

      const saveId = directSaveBtn.dataset.saveId || "";
      const sourceCard = directSaveBtn.closest(".card, .sm-pro-move-row, .sm-pro-pack-move-card");
      const item = findMoveForSave(saveId, sourceCard);
      if (!item || isPlan(item)) return;

      const nowSaved = toggleSaved(item);
      setMoveSaveUi(getVideoId(item), nowSaved);
      refreshSaveDependentViews();
      return;
    }

    const packCard = e.target.closest("[data-pro-pack]");
    if (packCard) {
      e.preventDefault();
      e.stopPropagation();
      activeProPackId = packCard.dataset.proPack || "car_event_air4future";

      // Real pack-detail open (free users are intercepted earlier into a preview modal,
      // so this only fires when the actual pack content opens).
      const _pack = getProPackItems().find((p) => String(p.id) === String(activeProPackId));
      emit("sm:pack_opened", {
        item_id: activeProPackId,
        item_type: "pack",
        title: _pack?.title || packCard.querySelector("h3")?.textContent?.trim() || "Pack",
        cover: _pack?.thumb || packCard.querySelector(".sm-pro-pack-img")?.getAttribute("src") || "",
        meta: _pack?.meta || ""
      });

      activeProTab = "packs";
      proSearchOpen = false;
      proSearchQuery = "";
      proSearchInputRef = null;
      scope.classList.add("sm-pro-subscreen");
      renderResults();
      return;
    }

    const card = e.target.closest(".card, .cardPlan, .sm-pro-move-row, .sm-pro-pack-move-card, .sm-pro-pack-plan-card");
    if (!card) return;

    const item = getLibraryItemFromCard(card);
    if (!item) return;

    const idx = getItemFilteredIndex(item);
    if (!Number.isFinite(idx) || idx < 0) return;

    const saveBtn = e.target.closest(".sm-save");

    if (saveBtn) {
      e.preventDefault();
      e.stopPropagation();

      if (isPlan(item)) return;

      const nowSaved = toggleSaved(item);
      setMoveSaveUi(getVideoId(item), nowSaved);
      refreshSaveDependentViews();
      return;
    }

    if (isPlan(item)) {
      const planShots = Number(item?.meta?.shots_count) || Number(item?.shots_count) || (Array.isArray(item?.steps) ? item.steps.length : 0);
      emit("sm:plan_opened", {
        item_id: item?.id || "",
        item_type: "plan",
        title: item?.title || "",
        cover: getPlanCover(item),
        meta: [planShots ? `${planShots} shots` : "", "Plan"].filter(Boolean).join(" · ")
      });

      window.dispatchEvent(new CustomEvent("sm:open-plan", {
        detail: {
          plan: item,
          allItems
        }
      }));

      // Direct fallback for local/dev builds where the CustomEvent listener is missed.
      if (window.SMPlanViewerV3 && typeof window.SMPlanViewerV3.open === "function") {
        window.SMPlanViewerV3.open(item, allItems);
      }

      return;
    }

    openPlayer(idx);
  });

  document.addEventListener("click", (e) => {
    if (e.target.closest("[data-pro-close-checklist]")) {
      e.preventDefault();
      closeProChecklist();
    }
  });

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeProChecklist();
  });


  function ensureBasicPlanViewer() {
    if (window.SMPlanViewerV3 && typeof window.SMPlanViewerV3.open === "function") return;

    window.SMPlanViewerV3 = {
      open(plan) {
        const existing = document.querySelector(".sm-basic-plan-viewer");
        if (existing) existing.remove();

        const steps = Array.isArray(plan?.steps) ? plan.steps : [];
        const cover = getPlanCover(plan) || FALLBACK_THUMB;
        const title = plan?.title || "Cinematic plan";
        const desc = getPlanDescription(plan) || "A ready-made cinematic sequence built from several drone moves.";
        const shots = getPlanShots(plan) || steps.length || 0;
        const time = getPlanShootTime(plan) || 0;
        const difficulty = getPlanDifficulty(plan) || plan?.difficulty || "Basic";

        const viewer = document.createElement("div");
        viewer.className = "sm-basic-plan-viewer";
        viewer.setAttribute("role", "dialog");
        viewer.setAttribute("aria-modal", "true");
        viewer.innerHTML = `
          <div class="sm-basic-plan-viewer__panel">
            <section class="sm-basic-plan-viewer__hero">
              <img src="${escapeHtml(cover)}" alt="" loading="eager">
              <button class="sm-basic-plan-viewer__close" type="button" aria-label="Close plan">×</button>
              <div class="sm-basic-plan-viewer__title">
                <h2>${escapeHtml(title)}</h2>
                <p>${escapeHtml(desc)}</p>
              </div>
            </section>
            <section class="sm-basic-plan-viewer__body">
              <div class="sm-basic-plan-viewer__meta">
                ${time ? `<span>${escapeHtml(time)} min</span>` : ""}
                ${shots ? `<span>${escapeHtml(shots)} shots</span>` : ""}
                <span>${escapeHtml(difficulty)}</span>
              </div>
              <div class="sm-basic-plan-viewer__steps">
                ${(steps.length ? steps : [{ title: "Opening shot" }, { title: "Main movement" }, { title: "Final detail" }]).map((step, index) => `
                  <div class="sm-basic-plan-viewer__step">
                    <strong>${index + 1}. ${escapeHtml(step?.title || step?.move_title || step?.name || "Shot")}</strong>
                    <span>${escapeHtml(step?.description || step?.note || step?.move || "Use this shot as part of the sequence.")}</span>
                  </div>
                `).join("")}
              </div>
            </section>
          </div>
        `;

        document.body.appendChild(viewer);
        document.documentElement.style.overflow = "hidden";
        document.body.style.overflow = "hidden";
        attachImgFallback(viewer);

        const close = () => {
          viewer.remove();
          document.documentElement.style.overflow = "";
          document.body.style.overflow = "";
        };

        viewer.querySelector(".sm-basic-plan-viewer__close")?.addEventListener("click", close);
        viewer.addEventListener("click", (e) => {
          if (e.target === viewer) close();
        });
      }
    };
  }

  ensureBasicPlanViewer();

  async function loadItems() {
    try {
      safeText(matchCount, "Loading…");
      isInitialLoading = true;
      showSkeletons(8);
      updateFilterUi();

      const res = await fetch(window.SM_LIBRARY_DATA_URL || CDN_INDEX_URL, { cache: "no-store" });
      if (!res.ok) throw new Error("HTTP " + res.status);

      const json = await res.json();
      const items = Array.isArray(json) ? json : [];

      const plans = items.filter(isPlan);
      const moves = items.filter((x) => !isPlan(x));

      allItems = [...plans, ...moves];
      isInitialLoading = false;

      applyFilters();

      // Refresh visual filter cards after CDN items load, so environment options can use real library thumbs.
      if (filterUsesProUi() && stepIndex < steps.length) {
        renderOptions();
        updateFilterUi();
      }

      setTimeout(() => {
        shakeFiltersButton();
      }, 700);
    } catch (e) {
      console.error("[SM] loadVideos error:", e);

      isInitialLoading = false;
      safeText(matchCount, "—");

      grid.innerHTML = `<div class="card" style="padding:14px">Failed to load videos.</div>`;

      if (moreBtn) moreBtn.style.display = "none";
      if (resultsHead) resultsHead.style.display = "none";

      updateFilterUi();
    }
  }

  (async () => {
    if (backBtn) backBtn.disabled = true;

    // Old chat intro is kept only for non-Pro layouts.
    // Mobile portrait and desktop Pro filters start directly as clean step screens.
    if (SM_FREE_STYLE_FILTER || (!isProMobilePortrait() && !isProDesktopLayout())) {
      await addBotTyped("Hi. Let’s browse moves and cinematic plans.");
      await addBotTyped(steps[0].text);
    } else {
      chat.innerHTML = "";
    }

    loadLocalSavedState();

    renderOptions();
    updateFilterUi();

    loadItems();

    setTimeout(() => {
      if (!assistant.classList.contains("active")) {
        shakeFiltersButton();
      }
    }, 4000);

    getMember(12000)
      .then((member) => {
        if (!member?.id) return null;
        return Promise.allSettled([
          hydrateAccessCache(),
          hydrateSavedCache().then(() => hydrateSavedItemsCache())
        ]);
      })
      .then(() => {
        renderResults();
        updateFilterUi();
      })
      .catch(() => null);
  })();

   (function setupPlayerAutoHideUI(){
  const modal = document.getElementById("modal");
  if (!modal) return;

  let hideTimer = null;

  function isPlayerOpen(){
    return modal.getAttribute("aria-hidden") === "false";
  }

  function showUI(){
    if (!isPlayerOpen()) return;

    modal.classList.remove("is-fs-ui-hidden");

    clearTimeout(hideTimer);
    hideTimer = setTimeout(() => {
      modal.classList.add("is-fs-ui-hidden");
    }, 2800);
  }

  function hideUI(){
    if (!isPlayerOpen()) return;
    modal.classList.add("is-fs-ui-hidden");
  }

  modal.addEventListener("mousemove", showUI);
  modal.addEventListener("touchstart", function(e){
    const clickedControl = e.target.closest(
      ".player__controls, .player__top, button, input"
    );

    if (clickedControl) {
      showUI();
      return;
    }

    if (modal.classList.contains("is-fs-ui-hidden")) {
      showUI();
    } else {
      hideUI();
    }
  }, { passive:true });

  modal.addEventListener("click", function(e){
    const clickedControl = e.target.closest(
      ".player__controls, .player__top, button, input"
    );

    if (clickedControl) {
      showUI();
      return;
    }

    if (modal.classList.contains("is-fs-ui-hidden")) {
      showUI();
    } else {
      hideUI();
    }
  });

  const observer = new MutationObserver(() => {
    if (isPlayerOpen()) {
      showUI();
    } else {
      clearTimeout(hideTimer);
      modal.classList.remove("is-fs-ui-hidden");
    }
  });

  observer.observe(modal, {
    attributes:true,
    attributeFilter:["aria-hidden"]
    });
  })();
})();
