(() => {
  "use strict";
  if (window.__SM_PLAN_VIEWER_V3__) return;
  window.__SM_PLAN_VIEWER_V3__ = true;

  const FALLBACK_THUMB = "https://skymotion-cdn.b-cdn.net/thumb.jpg";
  const RESULT_VIDEO_FALLBACK = "https://skymotion-cdn.b-cdn.net/1.mp4";
const root = document.getElementById("sm-plan-v3-root");
  const modal = document.getElementById("spv3Modal");
  const backdrop = document.getElementById("spv3Backdrop");
  const closeBtn = document.getElementById("spv3Close");
  const viewport = document.getElementById("spv3Viewport");
  const track = document.getElementById("spv3Track");
  const dots = document.getElementById("spv3Dots");

  if (!modal || !backdrop || !closeBtn || !viewport || !track || !dots) return;

  function emit(name, detail = {}) {
    window.dispatchEvent(new CustomEvent(name, { detail }));
  }

  let currentPlan = null;
  let currentAllItems = [];
  let suspendedPlanState = null;
  let activeSlide = 0;
  let totalSlides = 0;
  let cleanupFns = [];
  let navLocked = false;

  function setPlanViewportHeight() {
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty("--sm-plan-vh", `${vh}px`);
  }

  function escapeHtml(str) {
    return String(str ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function normalizeUrl(value) {
    const s = String(value ?? "").trim();
    return s || "";
  }

  function firstFilled(...values) {
    for (const value of values) {
      if (value === 0) return value;
      if (value === false) return value;
      if (value != null && String(value).trim() !== "") return value;
    }
    return "";
  }

  function toNumberSafe(...values) {
    for (const value of values) {
      const n = Number(value);
      if (Number.isFinite(n)) return n;
    }
    return 0;
  }

  function pickThumb(...candidates) {
    for (const item of candidates) {
      const url = normalizeUrl(item);
      if (url) return url;
    }
    return FALLBACK_THUMB;
  }

  function setBodyLock(locked) {
    document.documentElement.style.overflow = locked ? "hidden" : "";
    document.body.style.overflow = locked ? "hidden" : "";
  }

  function clearCleanup() {
    cleanupFns.forEach((fn) => {
      try { fn(); } catch (_) {}
    });
    cleanupFns = [];
  }

  function attachImgFallback(root) {
    if (!root) return;

    root.querySelectorAll("img").forEach((img) => {
      const src = normalizeUrl(img.getAttribute("src"));
      if (!src) img.src = FALLBACK_THUMB;

      img.addEventListener("error", () => {
        if (img.dataset.smFallbackApplied === "1") return;
        img.dataset.smFallbackApplied = "1";
        img.src = FALLBACK_THUMB;
      }, { once: true });
    });
  }

  function getMoveId(item) {
    return (
      item?.id ||
      item?.slug ||
      item?.videoUrl ||
      item?.video_url ||
      `${item?.title || ""}|${item?.duration || ""}`
    );
  }

  function getMoveByRef(allItems, moveRef) {
    if (!Array.isArray(allItems) || !moveRef) return null;
    return allItems.find((item) => String(getMoveId(item)) === String(moveRef)) || null;
  }

  function getStepMoveRef(step = {}) {
    return firstFilled(
      step?.move_ref,
      step?.moveRef,
      step?.move_id,
      step?.moveId
    );
  }

  function getPlanCover(plan) {
    return pickThumb(
      plan?.thumb?.a,
      plan?.thumb_a,
      plan?.steps?.[0]?.poster,
      plan?.steps?.[0]?.thumb,
      plan?.thumb,
      FALLBACK_THUMB
    );
  }

  function getPlanFinalVideo(plan) {
    return (
      normalizeUrl(
        firstFilled(
          plan?.result_video,
          plan?.resultVideo,
          plan?.final?.videoUrl,
          plan?.final?.video_url,
          plan?.final?.video
        )
      ) || RESULT_VIDEO_FALLBACK
    );
  }

  function getStepPoster(plan, step, move) {
    return pickThumb(
      step?.poster,
      step?.thumb,
      move?.thumb,
      move?.poster,
      move?.thumb_a,
      move?.image,
      plan?.thumb?.a,
      plan?.thumb_a,
      plan?.thumb?.b,
      plan?.thumb_b,
      FALLBACK_THUMB
    );
  }

  function getStepMoveUrl(step, move) {
    return normalizeUrl(
      firstFilled(
        step?.videoUrl,
        step?.video_url,
        step?.previewUrl,
        step?.preview_url,
        move?.videoUrl,
        move?.video_url
      )
    );
  }

  function toShotName(value, fallback = "Shot") {
    const s = String(value || "").trim();
    return s || fallback;
  }

  function formatSec(value) {
    const n = Number(value || 0);
    if (!Number.isFinite(n) || n <= 0) return "";
    return `${n.toFixed(1)}s`;
  }

  function hardStopVideo(video, { reset = true, mute = true } = {}) {
    if (!video) return;

    try { video.pause(); } catch (_) {}

    if (mute) {
      try {
        video.muted = true;
        video.defaultMuted = true;
        video.setAttribute("muted", "");
      } catch (_) {}
    }

    if (reset) {
      try { video.currentTime = 0; } catch (_) {}
    }
  }

  function normalizeTransitionName(value) {
    const raw = String(value || "").trim();
    if (!raw) return "Hard Cut";

    const key = raw
      .toLowerCase()
      .replace(/[_-]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    const map = {
      "cut": "Hard Cut",
      "hard cut": "Hard Cut",
      "hardcut": "Hard Cut",
      "dissolve": "Cross Dissolve",
      "cross dissolve": "Cross Dissolve",
      "crossdissolve": "Cross Dissolve",
      "fade": "Fade Out",
      "fade out": "Fade Out",
      "fadeout": "Fade Out",
      "fade in": "Fade In",
      "fadein": "Fade In",
      "whip pan": "Whip Pan",
      "whippan": "Whip Pan",
      "speed ramp": "Speed Ramp",
      "speedramp": "Speed Ramp",
      "match cut": "Match Cut",
      "matchcut": "Match Cut",
      "dip to black": "Dip To Black",
      "diptoblack": "Dip To Black",
      "none": "Hard Cut"
    };

    return map[key] || raw;
  }

  function getTransitionBadgeLabel(value) {
    const full = normalizeTransitionName(value);

    const shortMap = {
      "Hard Cut": "HARD CUT",
      "Cross Dissolve": "DISSOLVE",
      "Fade Out": "FADE OUT",
      "Fade In": "FADE IN",
      "Whip Pan": "WHIP PAN",
      "Speed Ramp": "SPEED RAMP",
      "Match Cut": "MATCH CUT",
      "Dip To Black": "DIP TO BLACK"
    };

    return shortMap[full] || full.toUpperCase();
  }

  function normalizeShotName(value) {
    const raw = String(value || "").trim();
    if (!raw) return "";

    const key = raw
      .toLowerCase()
      .replace(/[_-]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    const map = {
      "orbit": "Orbit",
      "raise up": "Raise Up",
      "move gimbal up": "Move + Gimbal Up",
      "gimbal reveal": "Gimbal Reveal",
      "move + gimbal reveal": "Move + Gimbal Reveal",
      "move + gimbal up": "Move + Gimbal Up",
      "take off": "Take Off",
      "top down": "Top Down",
      "push out": "Push Out",
      "3 directions": "3 Directions",
      "3 directions move": "3 Directions Move"
    };

    return map[key] || raw;
  }

  function getStepDuration(step = {}, edit = {}, move = {}) {
    return toNumberSafe(
      step?.duration_s,
      step?.duration,
      step?.durationSec,
      step?.seconds,
      edit?.dur_s,
      edit?.duration_s,
      edit?.duration,
      move?.duration_s,
      move?.duration,
      move?.seconds
    );
  }

  function getStepTransition(step = {}, edit = {}, move = {}) {
    return normalizeTransitionName(
      firstFilled(
        step?.transition,
        step?.transition_name,
        step?.transitionName,
        step?.cut,
        edit?.transition,
        edit?.transition_name,
        edit?.transitionName,
        edit?.cut,
        move?.transition,
        move?.transition_name,
        move?.transitionName
      )
    );
  }

  function getStepShortName(step = {}, edit = {}, move = {}, index = 0) {
    return toShotName(
      normalizeShotName(
        firstFilled(
          step?.short_title,
          step?.shortTitle,
          edit?.short_title,
          edit?.shortTitle,
          edit?.type,
          step?.timeline_title,
          step?.timelineTitle,
          move?.short_title,
          move?.shortTitle,
          move?.title,
          step?.title
        )
      ),
      `Shot ${index + 1}`
    );
  }

  function getStepTitle(step = {}, edit = {}, move = {}, index = 0) {
    return toShotName(
      firstFilled(
        step?.title,
        step?.name,
        step?.label,
        edit?.title,
        edit?.name,
        normalizeShotName(move?.title),
        move?.name,
        getStepShortName(step, edit, move, index)
      ),
      `Shot ${index + 1}`
    );
  }

  function getStepTip(step = {}, edit = {}, move = {}) {
    return firstFilled(
      step?.example_edit,
      step?.example,
      step?.tip,
      step?.hint,
      edit?.tip,
      edit?.example,
      edit?.hint,
      move?.tip,
      move?.example
    );
  }

  function getStepNote(step = {}, edit = {}, move = {}) {
    return firstFilled(
      step?.note,
      step?.description,
      edit?.note,
      edit?.description,
      move?.note,
      move?.description
    );
  }

  function findEditShotForStep(plan, step, index) {
    const editShots = Array.isArray(plan?.edit?.shots) ? plan.edit.shots : [];
    const ref = Number(
      firstFilled(
        step?.shot_ref,
        step?.shotRef,
        step?.shot,
        index + 1
      )
    );

    return (
      editShots.find((item) => {
        return Number(
          firstFilled(item?.n, item?.shot_ref, item?.shotRef, item?.shot)
        ) === ref;
      }) || null
    );
  }

  function setOpen(isOpen) {
    modal.setAttribute("aria-hidden", isOpen ? "false" : "true");
    setBodyLock(isOpen);
  }

  function closeModal() {
    if (currentPlan) {
      emit("sm:plan_closed", {
        item_id: currentPlan?.id || "",
        item_type: "plan",
        title: currentPlan?.title || "Cinematic Plan",
        last_slide_index: activeSlide
      });
    }

    const resultVideo = document.getElementById("spv3ResultVideo");
    hardStopVideo(resultVideo, { reset: true, mute: true });

    clearCleanup();
    setOpen(false);
    track.innerHTML = "";
    dots.innerHTML = "";
    currentPlan = null;
    currentAllItems = [];
    activeSlide = 0;
    totalSlides = 0;
    navLocked = false;
  }

  function buildDots() {
    dots.innerHTML = "";

    for (let i = 0; i < totalSlides; i += 1) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = `spv3Dot${i === activeSlide ? " is-active" : ""}`;
      btn.dataset.slide = String(i);
      btn.setAttribute("aria-label", `Go to slide ${i + 1}`);
      dots.appendChild(btn);
    }
  }

  function bindDotsOnly() {
    Array.from(dots.querySelectorAll(".spv3Dot")).forEach((btn) => {
      btn.onclick = () => goTo(Number(btn.dataset.slide || "0"), true);
    });
  }

  function syncPlanMedia() {
    const resultVideo = document.getElementById("spv3ResultVideo");
    if (!resultVideo) return;

    const isResultSlide = activeSlide === 0;

    if (isResultSlide) {
      try {
        resultVideo.muted = false;
        resultVideo.defaultMuted = false;
        resultVideo.removeAttribute("muted");
        resultVideo.volume = 1;
      } catch (_) {}

      const p = resultVideo.play();
      if (p && typeof p.catch === "function") {
        p.catch(() => {});
      }
    } else {
      hardStopVideo(resultVideo, { reset: true, mute: true });
    }
  }

  function renderSlides() {
    const slides = Array.from(track.querySelectorAll(".spv3__slide"));
    slides.forEach((slide, index) => {
      slide.classList.toggle("is-active", index === activeSlide);
    });
    buildDots();
    bindDotsOnly();
    syncPlanMedia();
  }

  function lockNavTemporarily() {
    navLocked = true;
    window.setTimeout(() => {
      navLocked = false;
    }, 260);
  }

  function goTo(index, animate = true) {
    const next = Math.max(0, Math.min(totalSlides - 1, Number(index || 0)));
    if (next === activeSlide) return;
    if (navLocked && animate) return;

    activeSlide = next;

    emit("sm:plan_slide_changed", {
      item_id: currentPlan?.id || "",
      item_type: "plan",
      title: currentPlan?.title || "Cinematic Plan",
      slide_index: activeSlide,
      slide_type: activeSlide === 0 ? "result" : "step"
    });

    if (animate) lockNavTemporarily();
    renderSlides();
  }

  function goNext() {
    if (activeSlide < totalSlides - 1) goTo(activeSlide + 1, true);
  }

  function goPrev() {
    if (activeSlide > 0) goTo(activeSlide - 1, true);
  }

  function getTimelineShots(plan, allItems = []) {
    const steps = Array.isArray(plan?.steps) ? plan.steps : [];

    return steps.map((step, index) => {
      const edit = findEditShotForStep(plan, step, index);
      const move = getMoveByRef(allItems, getStepMoveRef(step)) || null;

      const ref = Number(
        firstFilled(
          step?.shot_ref,
          step?.shotRef,
          edit?.n,
          index + 1
        )
      );

      return {
        index,
        ref,
        title: getStepTitle(step, edit, move, index),
        shortName: getStepShortName(step, edit, move, index),
        dur: getStepDuration(step, edit, move),
        tip: getStepTip(step, edit, move),
        note: getStepNote(step, edit, move),
        transition: getStepTransition(step, edit, move),
        powered: firstFilled(
          step?.powered,
          step?.powered_by,
          step?.poweredBy,
          plan?.powered,
          plan?.powered_by,
          plan?.poweredBy,
          "Powered by SkyMotion"
        )
      };
    });
  }

  function buildTimeline(plan, activeStepIndex) {
    const shots = getTimelineShots(plan, currentAllItems);

    function getClipTone(name = "", index = 0) {
      const s = String(name).toLowerCase();

      if (s.includes("orbit") || s.includes("spin") || s.includes("circle")) return "violet";
      if (s.includes("rise") || s.includes("reveal") || s.includes("fly") || s.includes("landscape")) return "gold";
      if (s.includes("gimbal") || s.includes("top") || s.includes("down") || s.includes("technical")) return "blue";

      return ["violet", "gold", "blue"][index % 3];
    }

    const timelineHtml = shots.map((shot, index) => {
      const tone = getClipTone(shot.shortName, index);
      const dur = Math.max(Number(shot.dur || 3), 2.5);
      const width = Math.max(120, Math.round(dur * 30));

      const clip = `
        <div
          class="spv3TimelineFlow__clip spv3TimelineFlow__clip--${tone} ${index === activeStepIndex ? "is-active" : ""}"
          style="width:${width}px"
        >
          <span class="spv3TimelineFlow__num">${String(index + 1).padStart(2, "0")}</span>
          <span class="spv3TimelineFlow__name">${escapeHtml(shot.shortName)}</span>
          <span class="spv3TimelineFlow__dur">${formatSec(shot.dur)}</span>
        </div>
      `;

      if (index === shots.length - 1) return clip;

      const nextTransition = getTransitionBadgeLabel(
        shots[index + 1]?.transition || shot.transition || "Hard Cut"
      );
      const isTransitionActive = index === activeStepIndex || index === activeStepIndex - 1;

      return `
        ${clip}
        <div class="spv3TimelineFlow__cut">
          <span class="spv3TimelineFlow__transition ${isTransitionActive ? "is-active" : ""}">
            ${escapeHtml(nextTransition)}
          </span>
        </div>
      `;
    }).join("");

    return `
      <div class="spv3Montage">
        <div class="spv3TimelineFlow">
          <div class="spv3TimelineFlow__label">Video Timeline</div>
          <div class="spv3TimelineFlow__scroller">
            <div class="spv3TimelineFlow__track">
              ${timelineHtml}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function buildResultSlide(plan) {
    const title = firstFilled(
      plan?.title,
      plan?.name,
      plan?.label,
      plan?.final?.title,
      "Cinematic Plan"
    );

    const poster = pickThumb(
      plan?.final?.poster,
      plan?.final?.thumb,
      getPlanCover(plan)
    );

    const videoUrl = getPlanFinalVideo(plan);

    return `
      <section class="spv3__slide">
        <div class="spv3Result">
          <video
            class="spv3Result__video"
            id="spv3ResultVideo"
            loop
            playsinline
            webkit-playsinline
            preload="metadata"
            poster="${escapeHtml(poster)}"
          >
            <source src="${escapeHtml(videoUrl)}" type="video/mp4">
          </video>

          <div class="spv3Result__overlay">
            <h2 class="spv3Result__title">${escapeHtml(title)}</h2>
          </div>
        </div>
      </section>
    `;
  }

  function buildStepSlide(plan, allItems, stepIndex) {
    const steps = Array.isArray(plan?.steps) ? plan.steps : [];
    const step = steps[stepIndex] || {};
    const edit = findEditShotForStep(plan, step, stepIndex);
    const move = getMoveByRef(allItems, getStepMoveRef(step));

    const title = getStepTitle(step, edit, move, stepIndex);
    const powered = firstFilled(
      step?.powered,
      step?.powered_by,
      step?.poweredBy,
      plan?.powered,
      plan?.powered_by,
      plan?.poweredBy,
      "Powered by SkyMotion"
    );

    const poster = getStepPoster(plan, step, move);
    const moveUrl = getStepMoveUrl(step, move);
    const moveRef = getStepMoveRef(step);

    return `
      <section class="spv3__slide">
        <div class="spv3Step">
          <div class="spv3Step__top">
            <img
              class="spv3Step__poster"
              src="${escapeHtml(poster)}"
              alt="${escapeHtml(title)}"
            />

            <div class="spv3Step__overlay">
              <h2 class="spv3Step__title">${escapeHtml(title)}</h2>
              <div class="spv3Step__powered">${escapeHtml(powered)}</div>
            </div>

            <button
              class="spv3PlayBtn"
              type="button"
              data-move-url="${escapeHtml(moveUrl)}"
              data-move-ref="${escapeHtml(moveRef)}"
              data-move-title="${escapeHtml(title)}"
              aria-label="Open move video"
            >
              <span class="spv3PlayIcon"></span>
            </button>
          </div>

          <div class="spv3Step__bottom">
            ${buildTimeline(plan, stepIndex)}
          </div>
        </div>
      </section>
    `;
  }

  function buildSlides(plan, allItems) {
    const steps = Array.isArray(plan?.steps) ? plan.steps : [];
    const html = [
      buildResultSlide(plan),
      ...steps.map((_, index) => buildStepSlide(plan, allItems, index))
    ].join("");

    track.innerHTML = html;
    attachImgFallback(track);
  }

  function openMoveFromButton(btn) {
    if (!btn) return;

    const moveRef = btn.getAttribute("data-move-ref") || "";
    const moveTitle = btn.getAttribute("data-move-title") || "Move video";
    const directUrl = normalizeUrl(btn.getAttribute("data-move-url") || "");
    const move = getMoveByRef(currentAllItems, moveRef);

    emit("sm:plan_step_video_opened", {
      item_id: currentPlan?.id || "",
      item_type: "plan",
      title: currentPlan?.title || "Cinematic Plan",
      move_ref: moveRef || "",
      move_title: moveTitle || "Move video",
      slide_index: activeSlide
    });

    const payload = move || {
      id: moveRef || directUrl,
      title: moveTitle,
      videoUrl: directUrl,
      video_url: directUrl,
      thumb: FALLBACK_THUMB,
      duration: ""
    };

    suspendedPlanState = {
      plan: currentPlan,
      allItems: currentAllItems,
      activeSlide
    };

    modal.setAttribute("aria-hidden", "true");
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";

    setTimeout(() => {
      window.dispatchEvent(new CustomEvent("sm:open-move-player", {
        detail: { move: payload }
      }));
    }, 20);
  }

  function isInteractiveScrollArea(target) {
    return !!target.closest(".spv3TimelineFlow__scroller");
  }

  async function tryPlayResultVideo(video) {
    if (!video) return;

    const isResultSlide = activeSlide === 0;

    video.loop = true;
    video.playsInline = true;
    video.setAttribute("playsinline", "");
    video.setAttribute("webkit-playsinline", "");

    if (!isResultSlide) {
      hardStopVideo(video, { reset: true, mute: true });
      return;
    }

    try {
      video.muted = false;
      video.defaultMuted = false;
      video.removeAttribute("muted");
      video.volume = 1;
    } catch (_) {}

    try {
      await video.play();
    } catch (err) {
      console.warn("[SPV3] result video play failed:", err);
    }
  }

  function bindSlideEvents() {
    const resultVideo = document.getElementById("spv3ResultVideo");
    const playButtons = Array.from(track.querySelectorAll(".spv3PlayBtn"));

    if (resultVideo) {
      let resultStartedTracked = false;

      const onLoaded = () => {
        tryPlayResultVideo(resultVideo);
      };

      const onPlay = () => {
        if (resultStartedTracked) return;
        resultStartedTracked = true;

        emit("sm:plan_result_video_started", {
          item_id: currentPlan?.id || "",
          item_type: "plan",
          title: currentPlan?.title || "Cinematic Plan"
        });
      };

      resultVideo.addEventListener("loadedmetadata", onLoaded);
      resultVideo.addEventListener("loadeddata", onLoaded);
      resultVideo.addEventListener("canplay", onLoaded);
      resultVideo.addEventListener("play", onPlay);

      cleanupFns.push(() => {
        resultVideo.removeEventListener("loadedmetadata", onLoaded);
        resultVideo.removeEventListener("loadeddata", onLoaded);
        resultVideo.removeEventListener("canplay", onLoaded);
        resultVideo.removeEventListener("play", onPlay);
        hardStopVideo(resultVideo, { reset: true, mute: true });
      });
    }

    playButtons.forEach((btn) => {
      const onClick = () => openMoveFromButton(btn);
      btn.addEventListener("click", onClick);
      cleanupFns.push(() => btn.removeEventListener("click", onClick));
    });

    bindDotsOnly();
  }

  function openPlan(plan, allItems = []) {
    if (root && root.parentElement !== document.body) {
  document.body.appendChild(root);
}
    clearCleanup();

    currentPlan = plan;
    currentAllItems = Array.isArray(allItems) ? allItems : [];
    totalSlides = 1 + (Array.isArray(plan?.steps) ? plan.steps.length : 0);
    activeSlide = 0;
    navLocked = false;

    setPlanViewportHeight();
    window.scrollTo(0, 0);

    emit("sm:plan_viewer_opened", {
      item_id: plan?.id || "",
      item_type: "plan",
      title: plan?.title || "Cinematic Plan",
      slides_count: totalSlides
    });

    buildSlides(plan, currentAllItems);
    setOpen(true);
    renderSlides();
    bindSlideEvents();

    let startX = 0;
    let startY = 0;
    let deltaX = 0;
    let deltaY = 0;
    let isTracking = false;
    let swipeTriggered = false;

    const onBackdropClick = () => closeModal();
    const onCloseClick = () => closeModal();

    const onKeyDown = (e) => {
      if (modal.getAttribute("aria-hidden") !== "false") return;
      if (e.key === "Escape") closeModal();
      else if (e.key === "ArrowRight") goNext();
      else if (e.key === "ArrowLeft") goPrev();
    };

    const onTouchStart = (e) => {
      if (isInteractiveScrollArea(e.target)) {
        isTracking = false;
        return;
      }

      const t = e.touches?.[0];
      if (!t) return;

      startX = t.clientX;
      startY = t.clientY;
      deltaX = 0;
      deltaY = 0;
      isTracking = true;
      swipeTriggered = false;
    };

    const onTouchMove = (e) => {
      if (!isTracking || swipeTriggered) return;

      const t = e.touches?.[0];
      if (!t) return;

      deltaX = t.clientX - startX;
      deltaY = t.clientY - startY;

      if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 10) {
        e.preventDefault();
      }
    };

    const onTouchEnd = () => {
      if (!isTracking || swipeTriggered) {
        isTracking = false;
        return;
      }

      if (Math.abs(deltaX) > 50 && Math.abs(deltaX) > Math.abs(deltaY)) {
        swipeTriggered = true;
        if (deltaX < 0) goNext();
        else goPrev();
      }

      isTracking = false;
      startX = 0;
      startY = 0;
      deltaX = 0;
      deltaY = 0;
    };

    backdrop.addEventListener("click", onBackdropClick);
    closeBtn.addEventListener("click", onCloseClick);
    window.addEventListener("keydown", onKeyDown);

    viewport.addEventListener("touchstart", onTouchStart, { passive: true });
    viewport.addEventListener("touchmove", onTouchMove, { passive: false });
    viewport.addEventListener("touchend", onTouchEnd, { passive: true });
    viewport.addEventListener("touchcancel", onTouchEnd, { passive: true });

    cleanupFns.push(() => backdrop.removeEventListener("click", onBackdropClick));
    cleanupFns.push(() => closeBtn.removeEventListener("click", onCloseClick));
    cleanupFns.push(() => window.removeEventListener("keydown", onKeyDown));
    cleanupFns.push(() => viewport.removeEventListener("touchstart", onTouchStart));
    cleanupFns.push(() => viewport.removeEventListener("touchmove", onTouchMove));
    cleanupFns.push(() => viewport.removeEventListener("touchend", onTouchEnd));
    cleanupFns.push(() => viewport.removeEventListener("touchcancel", onTouchEnd));
  }

  window.addEventListener("resize", setPlanViewportHeight);
  window.addEventListener("orientationchange", setPlanViewportHeight);
  setPlanViewportHeight();

  window.addEventListener("sm:open-plan", (e) => {
    const detail = e.detail || {};
    if (!detail.plan) return;
    openPlan(detail.plan, detail.allItems || []);
  });

  window.addEventListener("sm:reopen-plan-after-player", () => {
    if (!suspendedPlanState?.plan) return;

    const saved = suspendedPlanState;
    suspendedPlanState = null;

    openPlan(saved.plan, saved.allItems || []);
    if ((saved.activeSlide || 0) > 0) {
      activeSlide = saved.activeSlide || 0;
      renderSlides();
    }
  });

  window.SMPlanViewerV3 = {
    open: openPlan,
    close: closeModal
  };
})();
