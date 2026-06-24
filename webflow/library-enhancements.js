/* ============================================================================
 * library-enhancements.js — GENERATED from canonical index.html @ 3fe797a8f484bbe4d674ca74f06c895ff4772d08
 * The 7 inline enhancement script BODIES (IIFEs), in canonical order, with the
 * <script>/</script> wrappers stripped. Byte-exact otherwise. Loaded LAST by
 * library-loader.js, after library-pro.js and plan-viewer-v3.js.
 * Do not hand-edit; regenerate from index.html.
 * ============================================================================ */

/* [1/7] Skin: pack-detail backdrop video + footer + player loop/speed + montage (index.html 159-426) */
(function(){
  var VID = "https://s3.amazonaws.com/webflow-prod-assets/6766d6c8fc7f71813b295766/691f1934d921d227354db34f_1120(6).mp4";
  // single page scrollbar: the product sets overflow-y:auto inline on BOTH html
  // and body → two scrollbars. Force one scroller (html), or lock both.
  function pageScroll(mode){
    var h = document.documentElement, b = document.body;
    if (mode === "lock"){
      h.style.setProperty("overflow","hidden","important");
      b.style.setProperty("overflow","hidden","important");
    } else { // "single"
      h.style.removeProperty("overflow");
      b.style.removeProperty("overflow");
      h.style.setProperty("overflow-x","hidden","important");
      h.style.setProperty("overflow-y","auto","important");
      b.style.setProperty("overflow-x","hidden","important");
      b.style.setProperty("overflow-y","visible","important");  // body doesn't scroll → no 2nd bar
    }
  }
  function inject(bg){
    if(!bg || bg.querySelector("video.sm-skin-hero-vid")) return;
    var v = document.createElement("video");
    v.className = "sm-skin-hero-vid";
    v.muted = true; v.defaultMuted = true; v.loop = true; v.autoplay = true;
    v.setAttribute("muted",""); v.setAttribute("playsinline",""); v.setAttribute("autoplay","");
    v.playsInline = true; v.preload = "auto"; v.src = VID;
    bg.insertBefore(v, bg.firstChild);
    var img = bg.querySelector("img"); if (img) img.style.display = "none";
    var p = v.play(); if (p && p.catch) p.catch(function(){});
    setTimeout(function(){ pageScroll("single"); }, 0);   // pack open → single scrollbar
  }
  // animate the pack signature word-by-word (like the landing slogan)
  function animFooter(f){
    if (!f || f.__smAnim) return; f.__smAnim = true;
    var txt = (f.textContent || "").trim(); if (!txt) return;
    var parts = txt.split(/\s+/);
    f.textContent = "";
    parts.forEach(function(w, i){
      var s = document.createElement("span");
      s.className = "sm-skin-w"; s.textContent = w;
      s.style.transitionDelay = (i * 0.2) + "s";   // word-by-word stagger
      f.appendChild(s);
    });
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion:reduce)").matches){
      f.classList.add("sm-anim-in"); return;
    }
    // reveal word-by-word when the signature scrolls into view; replays each time
    if ("IntersectionObserver" in window){
      new IntersectionObserver(function(es){
        es.forEach(function(e){ f.classList.toggle("sm-anim-in", e.isIntersecting); });
      }, { threshold:0.5 }).observe(f);
    } else {
      f.classList.add("sm-anim-in");
    }
  }

  // our footer (landing-style) at the bottom of the pack page
  function injectFooter(screen){
    if (!screen || screen.querySelector(".sm-skin-foot")) return;
    var f = document.createElement("footer");
    f.className = "sm-skin-foot";
    f.innerHTML =
      '<div class="sm-skin-foot__in">' +
        '<div class="sm-skin-foot__top">' +
          '<a class="sm-skin-foot__brand" href="https://skymotion.cloud" aria-label="SkyMotion"><svg class="sm-skin-foot__logo" viewBox="0 0 690 147" role="img" aria-label="SkyMotion"><use href="#sm-logo"/></svg></a>' +
          '<nav class="sm-skin-foot__links">' +
            '<a href="https://skymotion.cloud/library">Open Library</a>' +
            '<a href="https://skymotion.cloud/pro-library">Pro</a>' +
            '<a href="https://skymotion.cloud/log-in">Log In</a>' +
            '<a href="https://skymotion.cloud/privacy-policy">Privacy</a>' +
            '<a href="https://skymotion.cloud/terms-of-use">Terms</a>' +
            '<a href="https://skymotion.cloud/contact">Contact</a>' +
          '</nav>' +
        '</div>' +
        '<div class="sm-skin-foot__bottom"><small>© ' + new Date().getFullYear() + ' SkyMotion</small></div>' +
      '</div>';
    screen.appendChild(f);
  }

  // Move/Plan video player: loop ON by default + speed (1x / 0.5x) toggle.
  // Additive only — the <video>.loop / .playbackRate are standard DOM APIs;
  // product JS (event bridge, fullscreen, analytics, prev/next) is untouched.
  function enhancePlayer(v){
    if (!v || v.__smEnh) return; v.__smEnh = true;
    var root = v.closest(".player");
    var top = root && root.querySelector(".player__top");
    var closeBtn = top && top.querySelector(".player__close");
    if (!top || !closeBtn) return;
    v.loop = true;                                  // loop by default (study on location)
    var cluster = document.createElement("div");
    cluster.className = "sm-skin-pcluster";
    // speed toggle (1× / 0.5×)
    var speeds = [1, 0.5], si = 0;
    var spd = document.createElement("button");
    spd.type = "button"; spd.className = "sm-skin-pbtn sm-skin-pbtn--speed";
    spd.setAttribute("aria-label", "Playback speed");
    spd.textContent = "1×";
    spd.addEventListener("click", function(){
      si = (si + 1) % speeds.length;
      try { v.playbackRate = speeds[si]; } catch (_) {}
      spd.textContent = (speeds[si] === 1 ? "1" : String(speeds[si])) + "×";
      spd.classList.toggle("is-on", speeds[si] !== 1);
    });
    // loop toggle (on by default)
    var lp = document.createElement("button");
    lp.type = "button"; lp.className = "sm-skin-pbtn sm-skin-pbtn--loop is-on";
    lp.setAttribute("aria-label", "Loop");
    lp.setAttribute("aria-pressed", "true");
    lp.innerHTML = "↻";
    lp.addEventListener("click", function(){
      v.loop = !v.loop;
      lp.classList.toggle("is-on", v.loop);
      lp.setAttribute("aria-pressed", v.loop ? "true" : "false");
    });
    cluster.appendChild(spd);
    cluster.appendChild(lp);
    top.insertBefore(cluster, closeBtn);
  }

  // Plan montage line: make each clip a navigation target + an edit recipe.
  // Navigates via the plan's own dots (#spv3Dots .spv3Dot[data-slide]) → goTo.
  // Additive only — plan-viewer-v3.js logic and the event bridge are untouched.
  function centerActiveClip(track){
    var scroller = track.closest(".spv3TimelineFlow__scroller");
    var active = track.querySelector(".spv3TimelineFlow__clip.is-active");
    if (!scroller || !active || !scroller.clientWidth) return;
    var target = active.offsetLeft - (scroller.clientWidth - active.clientWidth) / 2;
    target = Math.max(0, target);
    try { scroller.scrollTo({ left:target, behavior:"smooth" }); }
    catch (_) { scroller.scrollLeft = target; }
  }
  function wireMontage(track){
    if (!track || track.__smWired) return; track.__smWired = true;
    var clips = Array.prototype.slice.call(track.querySelectorAll(".spv3TimelineFlow__clip"));
    if (!clips.length) return;
    clips.forEach(function(clip, i){
      clip.classList.add("sm-skin-tl-tap");
      clip.setAttribute("role", "button");
      clip.setAttribute("tabindex", "0");
      var go = function(){
        var dot = document.querySelector('#spv3Dots .spv3Dot[data-slide="' + (i + 1) + '"]');
        if (dot) dot.click();
      };
      clip.addEventListener("click", go);
      clip.addEventListener("keydown", function(e){
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); go(); }
      });
    });
    // edit-recipe summary: N shots · M cuts · ~Xs
    var flow = track.closest(".spv3TimelineFlow");
    var label = flow && flow.querySelector(".spv3TimelineFlow__label");
    if (label && !flow.querySelector(".sm-skin-tl-sum")){
      var total = 0, parsed = 0;
      clips.forEach(function(clip){
        var d = clip.querySelector(".spv3TimelineFlow__dur");
        var mm = d && d.textContent.match(/([\d.]+)/);
        if (mm){ total += parseFloat(mm[1]); parsed++; }
      });
      var cuts = clips.length - 1;
      var txt = clips.length + (clips.length === 1 ? " shot" : " shots")
              + " · " + cuts + (cuts === 1 ? " cut" : " cuts");
      if (parsed === clips.length && total > 0) txt += " · ~" + Math.round(total) + "s";
      var sum = document.createElement("span");
      sum.className = "sm-skin-tl-sum";
      sum.textContent = txt;
      label.insertAdjacentElement("afterend", sum);
    }
    centerActiveClip(track);
  }

  var scope = document.getElementById("sm-library-scope") || document.body;
  document.querySelectorAll(".sm-pro-pack-bg").forEach(inject);
  document.querySelectorAll(".sm-pro-pack-footer").forEach(animFooter);
  document.querySelectorAll(".sm-pro-pack-detail-screen").forEach(injectFooter);
  document.querySelectorAll("#playerVideo").forEach(enhancePlayer);
  new MutationObserver(function(muts){
    muts.forEach(function(m){
      (m.addedNodes || []).forEach(function(n){
        if (n.nodeType !== 1) return;
        if (n.classList && n.classList.contains("sm-pro-pack-bg")) inject(n);
        var inner = n.querySelector && n.querySelector(".sm-pro-pack-bg");
        if (inner) inject(inner);
        if (n.classList && n.classList.contains("sm-pro-pack-footer")) animFooter(n);
        var foot = n.querySelector && n.querySelector(".sm-pro-pack-footer");
        if (foot) animFooter(foot);
        var screen = (n.classList && n.classList.contains("sm-pro-pack-detail-screen")) ? n
                   : (n.querySelector && n.querySelector(".sm-pro-pack-detail-screen"));
        if (screen) injectFooter(screen);
        var vid = (n.id === "playerVideo") ? n
                : (n.querySelector && n.querySelector("#playerVideo"));
        if (vid) enhancePlayer(vid);
      });
    });
  }).observe(scope, { childList:true, subtree:true });

  // plan montage line lives in its own root (#sm-plan-v3-root)
  var planRoot = document.getElementById("sm-plan-v3-root");
  if (planRoot){
    function scanTracks(n){
      if (n.classList && n.classList.contains("spv3TimelineFlow__track")) wireMontage(n);
      if (n.querySelectorAll) n.querySelectorAll(".spv3TimelineFlow__track").forEach(wireMontage);
    }
    planRoot.querySelectorAll(".spv3TimelineFlow__track").forEach(wireMontage);
    new MutationObserver(function(muts){
      muts.forEach(function(m){
        (m.addedNodes || []).forEach(function(n){
          if (n.nodeType !== 1) return;
          scanTracks(n);
        });
      });
    }).observe(planRoot, { childList:true, subtree:true });
  }

  // checklist modal: add the liked progress bar + count, wired to the checkboxes
  function enhanceSheet(sheet){
    if (!sheet || sheet.__smEnh) return; sheet.__smEnh = true;
    var boxes = sheet.querySelectorAll('input[type="checkbox"]');
    if (!boxes.length) return;
    var titleRow = sheet.querySelector(".sm-pro-pack-checklist-titleRow");
    var anchor = titleRow
              || sheet.querySelector(".sm-pro-pack-checklist-line")
              || sheet.querySelector(".sm-pro-pack-checklist-overlay");
    if (!anchor || !anchor.parentNode) return;
    // count → into the title row (clear stat, right-aligned)
    var countEl = document.createElement("span");
    countEl.className = "sm-skin-ck-count";
    countEl.textContent = "0 / " + boxes.length;
    if (titleRow) titleRow.appendChild(countEl);
    else anchor.parentNode.insertBefore(countEl, anchor.nextSibling);
    // a real progress bar below the header
    var barWrap = document.createElement("div");
    barWrap.className = "sm-skin-ck-bar"; barWrap.innerHTML = "<i></i>";
    anchor.parentNode.insertBefore(barWrap, anchor.nextSibling);
    var bar = barWrap.querySelector("i");
    function upd(){
      var d = 0; boxes.forEach(function(b){ if (b.checked) d++; });
      countEl.textContent = d + " / " + boxes.length;
      bar.style.width = (d / boxes.length * 100) + "%";
    }
    boxes.forEach(function(b){ b.addEventListener("change", upd); });
    upd();
  }
  new MutationObserver(function(muts){
    muts.forEach(function(m){
      (m.addedNodes || []).forEach(function(n){
        if (n.nodeType !== 1) return;
        var s = (n.classList && n.classList.contains("sm-pro-checklist-sheet")) ? n
              : (n.querySelector && n.querySelector(".sm-pro-checklist-sheet"));
        if (s){ enhanceSheet(s); pageScroll("lock"); }
      });
      (m.removedNodes || []).forEach(function(n){
        if (n.nodeType !== 1) return;
        var was = (n.classList && n.classList.contains("sm-pro-checklist-sheet"))
               || (n.querySelector && n.querySelector(".sm-pro-checklist-sheet"));
        if (was && !document.querySelector(".sm-pro-checklist-sheet")){
          pageScroll("single");   // restore single scrollbar (not double) after closing
        }
      });
    });
  }).observe(document.body, { childList:true, subtree:true });

  // restore the single scrollbar the instant a close is triggered (no flash of the double)
  document.addEventListener("click", function(e){
    if (e.target && e.target.closest && e.target.closest("[data-pro-close-checklist]")) pageScroll("single");
  }, true);
  document.addEventListener("keydown", function(e){
    if (e.key === "Escape" && document.querySelector(".sm-pro-checklist-sheet")) pageScroll("single");
  }, true);
})();

/* [2/7] Feedback widget logic (index.html 1041-1224) */
(() => {
  "use strict";
  if (window.__SM_FEEDBACK_WIDGET_PRODUCTION__) return;
  window.__SM_FEEDBACK_WIDGET_PRODUCTION__ = true;
  const root = document.getElementById("sm-feedback-widget");
  if (!root) return;
  const openBtn = root.querySelector("#smfbOpen");
  const modal = root.querySelector("#smfbModal");
  const closeBtn = root.querySelector("#smfbClose");
  const form = root.querySelector("#smfbForm");
  const steps = Array.from(root.querySelectorAll(".smfb-step"));
  const prevBtn = root.querySelector("#smfbPrev");
  const nextBtn = root.querySelector("#smfbNext");
  const actions = root.querySelector("#smfbActions");
  const errorBox = root.querySelector("#smfbError");
  const progressBar = root.querySelector("#smfbProgressBar");
  const usefulnessInput = root.querySelector("#smfbUsefulness");
  const usageInput = root.querySelector("#smfbUsageTime");
  const problemsInput = root.querySelector("#smfbProblems");
  const pageUrlInput = root.querySelector("#smfbPageUrl");
  let currentStep = 1;
  const totalSteps = 5;
  let selectedUsefulness = "";
  let selectedUsage = "";
  const SHOW_FLOATING_BUTTON_DELAY = 2500;
  window.setTimeout(() => {
    if (!openBtn) return;
    openBtn.classList.add("is-visible");
  }, SHOW_FLOATING_BUTTON_DELAY);
  function setBodyLock(locked) {
    document.documentElement.style.overflow = locked ? "hidden" : "";
    document.body.style.overflow = locked ? "hidden" : "";
  }
  function openModal() {
    modal.setAttribute("aria-hidden", "false");
    openBtn.classList.remove("is-visible");
    setBodyLock(true);
    errorBox.textContent = "";
    pageUrlInput.value = window.location.href;
    updateUI();
  }
  function closeModal() {
    modal.setAttribute("aria-hidden", "true");
    setBodyLock(false);
    window.setTimeout(() => {
      if (modal.getAttribute("aria-hidden") === "true") {
        openBtn.classList.add("is-visible");
      }
    }, 700);
  }
  function showStep(step) {
    steps.forEach((item) => {
      item.classList.toggle("is-active", String(item.dataset.step) === String(step));
    });
  }
  function updateUI() {
    showStep(currentStep);
    if (progressBar) {
      progressBar.style.width = `${(currentStep / totalSteps) * 100}%`;
    }
    prevBtn.disabled = currentStep === 1;
    nextBtn.textContent = currentStep === totalSteps ? "Submit" : "Next";
    errorBox.textContent = "";
  }
  function getCheckedProblems() {
    return Array.from(root.querySelectorAll(".smfb-check-list input:checked"))
      .map((input) => input.value);
  }
  function validateStep() {
    if (currentStep === 2 && !selectedUsefulness) {
      errorBox.textContent = "Please choose one option.";
      return false;
    }
    if (currentStep === 3 && !selectedUsage) {
      errorBox.textContent = "Please choose when you used SkyMotion.";
      return false;
    }
    return true;
  }
  function goNext() {
    if (!validateStep()) return;
    if (currentStep < totalSteps) {
      currentStep += 1;
      updateUI();
      requestAnimationFrame(() => {
        modal.scrollTo({ top:0, behavior:"smooth" });
      });
      return;
    }
    submitForm();
  }
  function goPrev() {
    if (currentStep <= 1) return;
    currentStep -= 1;
    updateUI();
    requestAnimationFrame(() => {
      modal.scrollTo({ top:0, behavior:"smooth" });
    });
  }
  async function submitForm() {
    const checkedProblems = getCheckedProblems();
    usefulnessInput.value = selectedUsefulness;
    usageInput.value = selectedUsage;
    problemsInput.value = checkedProblems.length ? checkedProblems.join(", ") : "No problem selected";
    pageUrlInput.value = window.location.href;
    const formData = new FormData(form);
    nextBtn.disabled = true;
    prevBtn.disabled = true;
    nextBtn.textContent = "Sending...";
    errorBox.textContent = "";
    try {
      const res = await fetch("https://api.web3forms.com/submit", {
        method:"POST",
        body:formData
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.message || "Could not send feedback.");
      }
      actions.style.display = "none";
      if (progressBar) progressBar.style.width = "100%";
      steps.forEach((item) => item.classList.remove("is-active"));
      const thanks = root.querySelector('[data-step="thanks"]');
      if (thanks) thanks.classList.add("is-active");
      window.setTimeout(() => {
        closeModal();
        resetForm();
      }, 1700);
    } catch (err) {
      nextBtn.disabled = false;
      prevBtn.disabled = false;
      nextBtn.textContent = "Submit";
      errorBox.textContent = "Feedback was not sent. Please try again.";
      console.error("[SkyMotion Feedback]", err);
    }
  }
  function resetForm() {
    currentStep = 1;
    selectedUsefulness = "";
    selectedUsage = "";
    usefulnessInput.value = "";
    usageInput.value = "";
    problemsInput.value = "";
    form.reset();
    root.querySelectorAll(".is-selected").forEach((el) => {
      el.classList.remove("is-selected");
    });
    actions.style.display = "";
    nextBtn.disabled = false;
    prevBtn.disabled = false;
    nextBtn.textContent = "Next";
    updateUI();
  }
  root.querySelectorAll('[data-group="usefulness"] .smfb-rating').forEach((btn) => {
    btn.addEventListener("click", () => {
      root.querySelectorAll('[data-group="usefulness"] .smfb-rating').forEach((item) => {
        item.classList.remove("is-selected");
      });
      btn.classList.add("is-selected");
      selectedUsefulness = btn.dataset.value || "";
      usefulnessInput.value = selectedUsefulness;
      errorBox.textContent = "";
    });
  });
  root.querySelectorAll('[data-group="usage"] .smfb-choice').forEach((btn) => {
    btn.addEventListener("click", () => {
      root.querySelectorAll('[data-group="usage"] .smfb-choice').forEach((item) => {
        item.classList.remove("is-selected");
      });
      btn.classList.add("is-selected");
      selectedUsage = btn.dataset.value || "";
      usageInput.value = selectedUsage;
      errorBox.textContent = "";
    });
  });
  openBtn.addEventListener("click", openModal);
  closeBtn.addEventListener("click", closeModal);
  nextBtn.addEventListener("click", goNext);
  prevBtn.addEventListener("click", goPrev);
  window.addEventListener("keydown", (e) => {
    if (modal.getAttribute("aria-hidden") !== "false") return;
    if (e.key === "Escape") closeModal();
  });
})();

/* [3/7] Pro pricing modal open/close (index.html 1311-1320) */
(function(){
  var modal = document.getElementById("sm-pro-modal");
  if (!modal) return;
  function open(){ modal.classList.add("is-open"); modal.setAttribute("aria-hidden","false"); }
  function close(){ modal.classList.remove("is-open"); modal.setAttribute("aria-hidden","true"); }
  window.smOpenProModal = open;
  window.smCloseProModal = close;
  modal.addEventListener("click", function(e){ if (e.target.closest("[data-sm-pclose]")) close(); });
  document.addEventListener("keydown", function(e){ if (e.key === "Escape" && modal.classList.contains("is-open")) close(); });
})();

/* [4/7] Pack value modal (index.html 1383-1403) */
(function(){
  var modal = document.getElementById("sm-pack-modal");
  if (!modal) return;
  window.smPackModal = {
    open: function(d){
      d = d || {};
      var cov = document.getElementById("smPkCover"); if (cov) cov.src = d.cover || "";
      var by  = document.getElementById("smPkBy");    if (by)  by.textContent = d.by || "";
      var t   = document.getElementById("smPkTitle"); if (t)   t.textContent = d.title || "Creator pack";
      var ch  = document.getElementById("smPkChips");
      if (ch){ ch.innerHTML = ""; (d.chips || []).forEach(function(c){ var s = document.createElement("span"); s.textContent = c; ch.appendChild(s); }); }
      var ds  = document.getElementById("smPkDesc");  if (ds)  ds.textContent = d.desc || "";
      modal.classList.add("is-open"); modal.setAttribute("aria-hidden", "false");
    },
    close: function(){ modal.classList.remove("is-open"); modal.setAttribute("aria-hidden", "true"); }
  };
  modal.addEventListener("click", function(e){ if (e.target.closest("[data-sm-pkclose]")) window.smPackModal.close(); });
  var unlock = document.getElementById("smPkUnlock");
  if (unlock) unlock.addEventListener("click", function(){ window.smPackModal.close(); if (window.smOpenProModal) window.smOpenProModal(); });
  document.addEventListener("keydown", function(e){ if (e.key === "Escape" && modal.classList.contains("is-open")) window.smPackModal.close(); });
})();

/* [5/7] Free/Pro gating injector (index.html 1408-1689) */
(function(){
  var scopeEl = document.getElementById("sm-library-scope");
  if (!scopeEl) return;

  var PRO_PLAN_ID = "pln_skymotion-pro-beta-r8ai0gbb";
  var CDN_INDEX  = (window.SM_LIBRARY_DATA_URL || "https://skymotion-cdn.b-cdn.net/videos_index_v16.json");
  var FREE_MOVES = 7, FREE_PLANS = 2;

  var IS_PRO = false;       // default locked/free until proven Pro
  var IS_AUTHED = false;    // logged in (Memberstack member exists) — distinct from Pro
  var FREE_SET = null;      // id -> 1 (null until data loaded)
  var SIGNUP_URL = window.SM_PRO_SIGNUP_URL || "https://skymotion.cloud/sign-up";
  // NOTE: real Pro checkout (Memberstack price id / Stripe) is intentionally deferred.
  // Until billing is configured, "Get Pro" is a placeholder (see the click handler below).

  function updateProBadge(){
    var want = IS_PRO ? "PRO" : "Basic";
    scopeEl.querySelectorAll(".sm-pro-badge, .sm-pro-tool-badge").forEach(function(badge){
      // only touch the DOM when something actually changes (avoids feedback loops with the observer)
      if (badge.textContent !== want) badge.textContent = want;
      if (badge.classList.contains("sm-badge-basic") === IS_PRO) badge.classList.toggle("sm-badge-basic", !IS_PRO);
    });
  }
  function updateProCTA(){
    var modal = document.getElementById("sm-pro-modal");
    if (!modal) return;
    var note = modal.querySelector(".sm-pmodal__note");
    // the "need a free account" line only applies to anonymous users;
    // don't clobber the "checkout coming soon" placeholder once it's shown
    if (note && !note.hasAttribute("data-sm-soon")) note.style.display = IS_AUTHED ? "none" : "";
  }
  function setTierClass(){
    scopeEl.classList.toggle("sm-pro", IS_PRO);
    scopeEl.classList.toggle("sm-free", !IS_PRO);
    scopeEl.classList.toggle("sm-authed", IS_AUTHED);
    scopeEl.classList.toggle("sm-anon", !IS_AUTHED);
    updateProBadge();
    updateProCTA();
  }
  setTierClass();

  function isPlanItem(it){ return String((it && it.kind) || "").toLowerCase() === "plan"; }
  function idCandidates(it){
    var c = [];
    ["id","slug","videoUrl","video_url"].forEach(function(k){ if (it[k]) c.push(String(it[k])); });
    if (it.title){ c.push(String(it.title)); c.push(String(it.title) + "|" + (it.duration || "")); }
    return c;
  }
  function buildFreeSet(items){
    var set = Object.create(null);
    var flagged = items.filter(function(i){ return i && i.free === true; });   // future: explicit free flag
    var freeItems;
    if (flagged.length){
      freeItems = flagged;
    } else {
      var plans = items.filter(isPlanItem);
      var moves = items.filter(function(i){ return !isPlanItem(i); });
      freeItems = moves.slice(0, FREE_MOVES).concat(plans.slice(0, FREE_PLANS));
    }
    freeItems.forEach(function(i){ idCandidates(i).forEach(function(c){ set[c] = 1; }); });
    return set;
  }
  function cardIsFree(card){
    if (card.hasAttribute("data-pro-pack")) return false;      // packs are always Pro
    var id = card.getAttribute("data-item-id");
    if (!id) return true;                                       // unknown → don't lock
    return FREE_SET ? !!FREE_SET[id] : false;                  // moves + plans: first-N free, rest locked-but-visible
  }
  var LOCK_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 10V8a5 5 0 0 1 10 0v2" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/><rect x="5" y="10" width="14" height="10" rx="2.4" fill="currentColor"/></svg>';
  function ensureBadge(card, isPack){
    if (card.querySelector(".sm-lock, .sm-pack-tag")) return;
    if (isPack){
      var t = document.createElement("span");
      t.className = "sm-pack-tag";
      t.innerHTML = LOCK_SVG + '<b>PRO</b>';
      card.appendChild(t);
    } else {
      var o = document.createElement("div");
      o.className = "sm-lock";
      o.innerHTML = '<span class="sm-lock__c">' + LOCK_SVG + '<span>Unlock with Pro</span></span>';
      card.appendChild(o);
    }
  }
  function removeBadge(card){
    var x = card.querySelector(".sm-lock, .sm-pack-tag");
    if (x) x.remove();
  }
  function openPackModal(card){
    var img  = card.querySelector(".sm-pro-pack-img");
    var by   = card.querySelector(".sm-pro-pack-badge");
    var ttl  = card.querySelector("h3");
    var meta = card.querySelector(".sm-pro-pack-meta");
    var desc = card.querySelector(".sm-pro-pack-content p");
    var chips = meta ? Array.prototype.map.call(meta.querySelectorAll("span"), function(s){ return s.textContent.trim(); }) : [];
    if (window.smPackModal) window.smPackModal.open({
      cover: img ? img.getAttribute("src") : "",
      by:    by ? by.textContent.trim() : "",
      title: ttl ? ttl.textContent.trim() : "Creator pack",
      chips: chips,
      desc:  desc ? desc.textContent.trim() : ""
    });
  }
  function processCard(card){
    if (!FREE_SET) return;
    var isPack = card.hasAttribute("data-pro-pack");
    if (!(card.hasAttribute("data-item-id") || isPack)) return;
    var lock = !IS_PRO && !cardIsFree(card);
    if (isPack) card.classList.toggle("sm-pack-gated", lock);
    else card.classList.toggle("sm-locked", lock);
    if (lock) ensureBadge(card, isPack); else removeBadge(card);
  }
  function processAll(){
    if (!FREE_SET) return;
    scopeEl.querySelectorAll("[data-item-id], [data-pro-pack]").forEach(processCard);
  }

  // move tile: lift the duration chip out of .meta so CSS can pin it to the card's top-left
  function liftBadges(){
    scopeEl.querySelectorAll(".sm-pro-card-grid .card > .meta > .badge").forEach(function(badge){
      var card = badge.closest(".card");
      if (card) card.appendChild(badge);   // becomes a direct child of .card
    });
  }

  // Saved tab → Pro-only message for free users
  function syncSavedMsg(){
    var savedScreen = scopeEl.querySelector(".sm-pro-saved-screen");
    var show = !IS_PRO && !!savedScreen;
    scopeEl.classList.toggle("sm-saved-locked", show);   // CSS hides the real saved content
    var host = (savedScreen && savedScreen.parentNode) || document.getElementById("resultsGrid");
    if (!host) return;
    // only manage the MAIN saved message — never the Moves-screen one (distinct class)
    var existing = host.querySelector(".sm-saved-msg:not(.sm-saved-msg--moves)");
    if (show && !existing){
      var el = document.createElement("div");
      el.className = "sm-saved-msg";
      el.innerHTML =
        '<div class="sm-saved-msg__ghost" aria-hidden="true"><i></i><i></i><i></i></div>' +
        '<div class="sm-saved-msg__in">' +
          '<h3>Save your moves with Pro</h3>' +
          '<p>Bookmark moves and plans, and build your own shoots on location.</p>' +
          '<button type="button" class="sm-saved-msg__btn">Unlock Pro →</button>' +
        '</div>';
      host.appendChild(el);
      var btn = el.querySelector(".sm-saved-msg__btn");
      if (btn) btn.addEventListener("click", function(){ if (window.smOpenProModal) window.smOpenProModal(); });
    } else if (!show && existing){
      existing.remove();
    }
  }

  // Saved sub-tab INSIDE the Moves screen → same Pro-only ghost message for free users
  function syncMovesSavedLock(){
    var movesScreen = scopeEl.querySelector(".sm-pro-moves-screen");
    if (!movesScreen) return;
    var savedActive = false;
    movesScreen.querySelectorAll(".sm-pro-level-tabs button.is-active").forEach(function(b){
      if (String(b.textContent || "").trim().toLowerCase() === "saved") savedActive = true;
    });
    var show = !IS_PRO && savedActive;
    movesScreen.classList.toggle("sm-saved-locked", show);
    var existing = movesScreen.querySelector(".sm-saved-msg--moves");
    if (show && !existing){
      var el = document.createElement("div");
      el.className = "sm-saved-msg sm-saved-msg--moves";
      el.innerHTML =
        '<div class="sm-saved-msg__ghost" aria-hidden="true"><i></i><i></i><i></i></div>' +
        '<div class="sm-saved-msg__in">' +
          '<h3>Save your moves with Pro</h3>' +
          '<p>Bookmark moves and plans, and build your own shoots on location.</p>' +
          '<button type="button" class="sm-saved-msg__btn">Unlock Pro →</button>' +
        '</div>';
      movesScreen.appendChild(el);
      var btn = el.querySelector(".sm-saved-msg__btn");
      if (btn) btn.addEventListener("click", function(){ if (window.smOpenProModal) window.smOpenProModal(); });
    } else if (!show && existing){
      existing.remove();
    }
  }

  // build the free set from the same CDN index the library uses
  fetch(CDN_INDEX, { cache:"no-store" })
    .then(function(r){ return r.json(); })
    .then(function(json){ FREE_SET = buildFreeSet(Array.isArray(json) ? json : []); processAll(); })
    .catch(function(){ /* if data fails, leave cards unlocked to avoid false locks */ });

  // resolve Memberstack member → authed? + Pro? (re-runnable so we can update live)
  function applyMember(res){
    var m = (res && res.data && res.data.member) || (res && res.data) || (res && res.member) || res || null;
    IS_AUTHED = !!m;
    var conns = m && m.planConnections;
    IS_PRO = Array.isArray(conns) && conns.some(function(pc){
      if (!pc) return false;
      var id = pc.planId || (pc.plan && pc.plan.id);
      if (id !== PRO_PLAN_ID) return false;
      if (pc.active === false) return false;
      if (pc.status && /cancel|expired|inactive|past_due/i.test(String(pc.status))) return false;
      return true;
    });
    setTierClass(); processAll(); syncSavedMsg(); syncMovesSavedLock();
  }
  function checkMember(){
    var ms = window.$memberstackDom || window.$memberstack;
    if (ms && ms.getCurrentMember){
      ms.getCurrentMember().then(applyMember).catch(function(){
        IS_AUTHED = false; setTierClass(); processAll(); syncSavedMsg();
      });
      return true;
    }
    return false;
  }
  (function resolve(tries){
    if (checkMember()) return;
    if (tries > 0){ setTimeout(function(){ resolve(tries - 1); }, 250); }
    else { IS_AUTHED = false; setTierClass(); processAll(); syncSavedMsg(); }   // no Memberstack → anonymous
  })(40);

  // "Get Pro" — placeholder until Memberstack billing is configured.
  //  • anonymous      → follow the <a href="/sign-up"> link (create a free account first)
  //  • logged-in Free → keep the pricing modal open as upgrade intent only; no real checkout yet
  (function(){
    var modal = document.getElementById("sm-pro-modal");
    if (!modal) return;
    modal.addEventListener("click", function(e){
      var cta = e.target.closest && e.target.closest(".sm-pbtn--solid");
      if (!cta) return;
      if (!IS_AUTHED) return;                  // anonymous → let the sign-up link proceed
      e.preventDefault();                      // logged-in Free → no checkout yet (billing deferred)
      var note = modal.querySelector(".sm-pmodal__note");
      if (note){
        note.setAttribute("data-sm-soon", "1");
        note.style.display = "";
        note.textContent = "Pro checkout is coming soon — you’ll be able to upgrade right here.";
      }
    });
  })();

  // process cards as they render + keep the saved message in sync
  new MutationObserver(function(muts){
    var touched = false;
    muts.forEach(function(m){
      (m.addedNodes || []).forEach(function(n){
        if (n.nodeType !== 1) return;
        touched = true;
        if (n.matches && n.matches("[data-item-id], [data-pro-pack]")) processCard(n);
        if (n.querySelectorAll) n.querySelectorAll("[data-item-id], [data-pro-pack]").forEach(processCard);
      });
    });
    if (touched){ syncSavedMsg(); updateProBadge(); syncMovesSavedLock(); liftBadges(); }
  }).observe(scopeEl, { childList:true, subtree:true });

  // Moves level-tab clicks → re-check the Saved lock (backup to the observer)
  scopeEl.addEventListener("click", function(e){
    if (e.target.closest && e.target.closest(".sm-pro-level-tabs button")){
      setTimeout(syncMovesSavedLock, 30);
      setTimeout(syncMovesSavedLock, 220);
    }
  }, false);

  // intercept clicks on locked cards → open the Pro modal (capture phase, before product handlers)
  scopeEl.addEventListener("click", function(e){
    var pack = e.target.closest && e.target.closest(".sm-pack-gated");
    if (pack && scopeEl.contains(pack)){
      e.preventDefault(); e.stopPropagation();
      openPackModal(pack);
      return;
    }
    var locked = e.target.closest && e.target.closest(".sm-locked");
    if (locked && scopeEl.contains(locked)){
      e.preventDefault(); e.stopPropagation();
      if (window.smOpenProModal) window.smOpenProModal();
    }
  }, true);

  // re-sync the Saved message shortly after any tab switch (backup to the observer)
  scopeEl.addEventListener("click", function(e){
    if (e.target.closest && e.target.closest("[data-pro-tab]")){
      setTimeout(syncSavedMsg, 60);
      setTimeout(syncSavedMsg, 300);
    }
  });
})();

/* [6/7] Last-watched header slot — real last opened move / plan / pack */
(function(){
  // New storage key. We intentionally do NOT migrate or read the old "sm_last_move"
  // (move-only / possibly stale) — start clean.
  var KEY = "sm_last_item";
  var TYPES = { move: "MOVE", plan: "PLAN", pack: "PACK" };
  var scopeEl = document.getElementById("sm-library-scope") || document.body;

  function getLast(){
    try {
      var v = JSON.parse(localStorage.getItem(KEY) || "null");
      if (v && v.id && TYPES[v.type]) return v;
    } catch(_) {}
    return null;
  }
  function setLast(obj){
    try { localStorage.setItem(KEY, JSON.stringify(obj)); } catch(_) {}
  }
  function clearLast(){
    try { localStorage.removeItem(KEY); } catch(_) {}
  }
  function esc(s){ try { return (window.CSS && CSS.escape) ? CSS.escape(s) : String(s).replace(/["\\]/g,"\\$&"); } catch(_){ return String(s); } }

  function findCard(type, id){
    if (type === "pack") return scopeEl.querySelector('[data-pro-pack="' + esc(id) + '"]');
    var kind = (type === "plan") ? "plan" : "move";
    var cards = scopeEl.querySelectorAll('[data-kind="' + kind + '"]');
    for (var i=0;i<cards.length;i++){
      if (String(cards[i].dataset.itemId) === String(id)) return cards[i];
    }
    return null;
  }
  function tabFor(type){ return type === "plan" ? "plans" : type === "pack" ? "packs" : "moves"; }
  function tabButton(name){
    var found = null;
    scopeEl.querySelectorAll(".sm-pro-mobile-tabs button").forEach(function(b){
      var k = String(b.dataset.proTab || b.textContent || "").trim().toLowerCase();
      if (k === name) found = b;
    });
    return found;
  }

  // Empty-state action (desktop only — the slot never shows on mobile): focus the
  // Assistant panel. Never opens fake content.
  function openAssistant(){
    var panel = scopeEl.querySelector(".assistant");
    if (panel){
      if (!panel.hasAttribute("tabindex")) panel.setAttribute("tabindex","-1");
      try { panel.focus(); } catch(_){}
      try { panel.scrollIntoView({ block:"nearest" }); } catch(_){}
    }
  }

  function reopenLast(){
    var last = getLast();
    if (!last){ openAssistant(); return; }   // empty state → Assistant
    var card = findCard(last.type, last.id);
    if (card){ card.click(); return; }
    // not on screen → switch to its tab, then open once rendered
    var tb = tabButton(tabFor(last.type));
    if (tb){
      tb.click();
      setTimeout(function(){
        var c = findCard(last.type, last.id);
        if (c){ c.click(); }
        else { clearLast(); renderSlot(); }   // stale (no longer in data) → empty state, no error
      }, 140);
    }
  }

  function ensureSlot(){
    var top = scopeEl.querySelector(".sm-pro-mobile-top");
    if (!top) return null;
    var slot = top.querySelector(".sm-last-watched");
    if (!slot){
      slot = document.createElement("button");
      slot.type = "button";
      slot.className = "sm-last-watched";
      slot.innerHTML =
        '<span class="sm-lw__th"><img class="sm-lw__img" alt="" />' +
          '<svg class="sm-lw__ph" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z"></path></svg>' +
        '</span>' +
        '<span class="sm-lw__t"><span class="sm-lw__ey"></span><span class="sm-lw__name"></span></span>';
      slot.addEventListener("click", reopenLast);
      top.appendChild(slot);
    }
    return slot;
  }

  function renderSlot(){
    var slot = ensureSlot();
    if (!slot) return;
    var last = getLast();
    // Preserve the prior header behavior: .sm-has-last toggles the mobile quote.
    // (The slot itself is desktop-only via CSS; this keeps mobile identical to before.)
    var top = scopeEl.querySelector(".sm-pro-mobile-top");
    if (top) top.classList.toggle("sm-has-last", !!last);
    var img = slot.querySelector(".sm-lw__img");
    var ey = slot.querySelector(".sm-lw__ey");
    var name = slot.querySelector(".sm-lw__name");

    if (last){
      slot.classList.remove("sm-lw--empty");
      slot.setAttribute("aria-label", "Reopen last opened " + (last.type || "item"));
      var cover = last.cover || "";
      if (cover){ img.src = cover; img.style.display = ""; }
      else { img.removeAttribute("src"); img.style.display = "none"; }
      img.onerror = function(){ img.style.display = "none"; };   // graceful: bad cover → hide img
      ey.textContent = TYPES[last.type] || "";
      name.textContent = last.title || "";
    } else {
      slot.classList.add("sm-lw--empty");
      slot.setAttribute("aria-label", "Start your first move");
      img.removeAttribute("src"); img.style.display = "none";
      ey.textContent = "";
      name.textContent = "Start your first move";
    }
  }

  function record(type, d){
    if (!d || !d.item_id || !TYPES[type]) return;
    setLast({
      type: type,
      id: String(d.item_id),
      title: d.title || "",
      cover: d.cover || "",
      meta: d.meta || "",
      ts: Date.now()
    });
    renderSlot();
  }

  // Only real content opens reach these events (locked previews are intercepted
  // earlier and never emit), so Last watched never records a locked preview.
  window.addEventListener("sm:move_opened", function(e){ record("move", e.detail || {}); });
  window.addEventListener("sm:plan_opened", function(e){ record("plan", e.detail || {}); });
  window.addEventListener("sm:pack_opened", function(e){ record("pack", e.detail || {}); });

  // Always render (empty state included) so the slot replaces the marketing quote.
  renderSlot();
  setTimeout(renderSlot, 400);
})();

/* [7/7] Mobile filter-drawer open helper (index.html 1775-1787) */
(function(){
  var a = document.querySelector("#sm-library-scope .assistant");
  if (!a) return;
  function sync(){
    if (window.matchMedia("(max-width:900px)").matches && a.classList.contains("active"))
      a.style.setProperty("transform", "translateX(0)", "important");
    else
      a.style.removeProperty("transform");
  }
  new MutationObserver(sync).observe(a, { attributes:true, attributeFilter:["class"] });
  window.addEventListener("resize", sync);
  sync();
})();
