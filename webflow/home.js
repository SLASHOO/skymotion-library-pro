/* ============================================================================
 * home.js — GENERATED from canonical landing.html (inline <script>, lines 763-968)
 * Byte-exact. Loaded LAST by home-loader.js, after the template is injected.
 * Do not hand-edit; regenerate from landing.html.
 * ============================================================================ */
  document.getElementById('yr').textContent = new Date().getFullYear();

  var nav = document.getElementById('nav');
  var onScroll = function(){ nav.classList.toggle('scrolled', window.scrollY > 24); };
  onScroll(); window.addEventListener('scroll', onScroll, { passive:true });

  var rs = document.querySelectorAll('.r');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function(es){
      es.forEach(function(e){ if (e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold:.14, rootMargin:'0px 0px -10% 0px' });
    rs.forEach(function(el){ io.observe(el); });
  } else { rs.forEach(function(el){ el.classList.add('in'); }); }

  // SCHEME route: draw while the section is in view, reset when it leaves (no loop)
  (function(){
    var sc = document.querySelector('.scheme');
    if(!sc) return;
    if(!('IntersectionObserver' in window)){ sc.classList.add('drawing'); return; }
    var so = new IntersectionObserver(function(es){
      es.forEach(function(e){ sc.classList.toggle('drawing', e.isIntersecting); });
    }, { threshold:0.3 });
    so.observe(sc);
  })();

  // re-play the steps route draw every time the section enters view
  (function(){
    var sc = document.querySelector('.scheme');
    if(!sc) return;
    if(!('IntersectionObserver' in window)){ sc.classList.add('drawing'); return; }
    var io2 = new IntersectionObserver(function(es){
      es.forEach(function(e){ sc.classList.toggle('drawing', e.isIntersecting); });
    }, { threshold:0.2 });
    io2.observe(sc);
  })();

  // How-to-use: the dashed route draws in sync with scroll
  (function(){
    var viz = document.querySelector('.viz');
    var scheme = document.querySelector('.scheme');
    if(!viz || !scheme) return;
    if(window.matchMedia('(prefers-reduced-motion:reduce)').matches){ viz.style.clipPath='none'; viz.style.opacity='1'; return; }
    var ticking = false;
    function update(){
      ticking = false;
      var r = scheme.getBoundingClientRect();
      var vh = window.innerHeight;
      var p = (vh * 0.85 - r.top) / (vh * 0.55);   // 0 entering → 1 fully drawn
      p = Math.min(Math.max(p, 0), 1);
      viz.style.clipPath = 'inset(0 ' + ((1 - p) * 100).toFixed(2) + '% 0 0)';
      viz.style.opacity = p > 0 ? '1' : '0';
    }
    function onScroll(){ if(!ticking){ ticking = true; requestAnimationFrame(update); } }
    window.addEventListener('scroll', onScroll, { passive:true });
    window.addEventListener('resize', onScroll);
    update();
  })();

  // Pro: pitch parallax (own section, stays) + separate word-by-word slogan
  (function(){
    var pro = document.getElementById('pro');
    if(!pro) return;
    var pitchSec = pro.querySelector('.pro__pitchSec');
    var video = pro.querySelector('.pro__video');
    var sloganSec = pro.querySelector('.pro__sloganSec');
    var words = pro.querySelectorAll('.pro__slogan .w');
    if(window.matchMedia('(prefers-reduced-motion:reduce)').matches){
      words.forEach(function(w){ w.classList.add('on'); });
      return;
    }
    var ticking = false;
    function set(el, on){ if(el) el.classList.toggle('on', on); }
    function update(){
      ticking = false;
      var vh = window.innerHeight;
      // PITCH: start the moment the video enters from the bottom (top = vh) → sharp as it rises in
      if(video && pitchSec){
        var rawp = (vh - pitchSec.getBoundingClientRect().top) / vh;   // 0 entering, 1 pinned
        var vp = Math.min(Math.max(rawp / 0.65, 0), 1);
        video.style.transform = 'scale(' + (1.06 - 0.06 * vp).toFixed(3) + ')';
        video.style.filter = 'blur(' + (6 * (1 - vp)).toFixed(2) + 'px)';
      }
      // SLOGAN: words appear as its section enters — no dead scroll
      if(sloganSec){
        var sp = Math.min(Math.max((vh - sloganSec.getBoundingClientRect().top) / sloganSec.offsetHeight, 0), 1);
        set(words[0], sp > 0.40);
        set(words[1], sp > 0.56);
        set(words[2], sp > 0.72);
      }
    }
    function onScroll(){ if(!ticking){ ticking = true; requestAnimationFrame(update); } }
    window.addEventListener('scroll', onScroll, { passive:true });
    window.addEventListener('resize', onScroll);
    update();
  })();

  // LIBRARY guided tour — auto-advancing spotlight on the mockup
  (function(){
    var lib = document.querySelector('.lib');
    if(!lib) return;
    var spot = lib.querySelector('.tour__spot');
    var tip = lib.querySelector('.tour__tip');
    if(!spot || !tip) return;
    var tipTitle = tip.querySelector('.tour__title');
    var tipText = tip.querySelector('.tour__text');
    var dots = tip.querySelectorAll('.tour__dots i');
    var steps = [
      { sel:'.fchips', selM:'.fchips', title:"Conditions", text:"Open Filters, tell SkyMotion where you're flying and the conditions you're working in, then close it." },
      { sel:'.asst__h span', selM:'.lib__mfilters', title:"Filtered for your location", text:"SkyMotion removes the moves that don't fit and leaves only the ones that make sense here." },
      { sel:'.mtile:not(.mtile--plan)', selM:'.mtile:not(.mtile--plan)', title:"Moves", text:"Every move includes a video preview, difficulty level, and estimated flight time. Free includes the essential moves used in most shoots." },
      { sel:'.mtile--plan', selM:'.mtile--plan', title:"Plans", text:"A plan combines multiple moves into a complete shooting sequence, so you can follow the shoot step by step instead of building it yourself." },
      { sel:'.mgrid', selM:'.mgrid', title:"Moves or Plans?", text:"Use moves when you already know the shot you want. Use plans when you want a complete sequence ready to follow on location." }
    ];
    var isM = function(){ return window.matchMedia('(max-width:760px)').matches; };
    var i = 0, timer = null, running = false;
    function place(){
      var mobile = isM();
      // on mobile, the conditions step opens the filter drawer (like the real app); other steps close it
      lib.classList.toggle('drawer-open', mobile && i===0);
      var sel = (mobile && steps[i].selM) ? steps[i].selM : steps[i].sel;
      var t = lib.querySelector(sel);
      if(!t) return;
      // set text first so the tip's real height is known before positioning
      tipTitle.textContent = steps[i].title;
      tipText.textContent = steps[i].text;
      dots.forEach(function(d,di){ d.classList.toggle('on', di===i); });
      var lr = lib.getBoundingClientRect(), tr = t.getBoundingClientRect(), pad = 8;
      var x = tr.left - lr.left - pad, y = tr.top - lr.top - pad, w = tr.width + pad*2, h = tr.height + pad*2;
      spot.style.left = x+'px'; spot.style.top = y+'px'; spot.style.width = w+'px'; spot.style.height = h+'px';
      var tw = Math.min(250, lr.width - 20);
      tip.style.width = tw+'px';
      var tx = Math.min(Math.max(x, 10), lr.width - tw - 10);
      var th = tip.offsetHeight || 120;
      var below = y + h + 12, above = y - th - 12, ty;
      if(below + th + 10 <= lr.height) ty = below;          // fits under the highlight
      else if(above >= 10) ty = above;                      // else flip above it
      else ty = Math.max(10, lr.height - th - 10);          // else clamp inside the frame
      tip.style.left = tx+'px'; tip.style.top = ty+'px';
    }
    function next(){ i = (i+1) % steps.length; place(); }
    function reset(){ if(timer) clearInterval(timer); timer = setInterval(next, 4800); }
    function start(){ if(running) return; running = true; lib.classList.add('tour-on'); place(); reset(); }
    function stop(){ running = false; lib.classList.remove('tour-on'); lib.classList.remove('drawer-open'); if(timer){ clearInterval(timer); timer = null; } }
    if('IntersectionObserver' in window){
      var io = new IntersectionObserver(function(es){ es.forEach(function(e){ e.isIntersecting ? start() : stop(); }); }, { threshold:0.35 });
      io.observe(lib);
    } else { start(); }
    lib.addEventListener('click', function(){ if(running){ next(); reset(); } });
    lib.addEventListener('mouseenter', function(){ if(timer){ clearInterval(timer); timer = null; } });
    lib.addEventListener('mouseleave', function(){ if(running && !timer) reset(); });
    window.addEventListener('resize', function(){ if(running) place(); });
  })();

  // PRICING POPUP — open from any [data-open-pro], close on X / backdrop / Esc
  (function(){
    var nav = document.getElementById('nav');
    // Wire to Memberstack: setAuth('guest' | 'member' | 'pro')
    window.setAuth = function(state){ if(nav) nav.setAttribute('data-auth', state); };

    var modal = document.getElementById('proModal');
    if(!modal) return;
    var buy = modal.querySelector('.pmodal__buy');
    var note = modal.querySelector('.pmodal__note');
    var SIGNUP_URL = 'https://skymotion.cloud/sign-up';
    var CHECKOUT_URL = 'https://skymotion.cloud/pro-library';   // member-buy destination (swap if you add a dedicated checkout)
    function open(){
      // must register before buying — guests go to sign-up, members to checkout
      // ('loading' resolves to the guest path until Memberstack confirms a member)
      var auth = nav ? nav.getAttribute('data-auth') : 'guest';
      var loggedIn = (auth === 'member' || auth === 'pro');
      if(buy){
        if(!loggedIn){ buy.textContent = 'Sign up to get Pro'; buy.href = SIGNUP_URL; }
        else { buy.textContent = 'Get Pro'; buy.href = CHECKOUT_URL; }
      }
      if(note) note.style.display = loggedIn ? 'none' : '';
      modal.classList.add('open'); modal.setAttribute('aria-hidden','false'); document.body.style.overflow='hidden';
    }
    function close(){ modal.classList.remove('open'); modal.setAttribute('aria-hidden','true'); document.body.style.overflow=''; }
    document.querySelectorAll('[data-open-pro]').forEach(function(b){ b.addEventListener('click', function(e){ e.preventDefault(); open(); }); });
    modal.querySelectorAll('[data-close]').forEach(function(b){ b.addEventListener('click', close); });
    document.addEventListener('keydown', function(e){ if(e.key === 'Escape' && modal.classList.contains('open')) close(); });
  })();

  // AUTH STATE — drive the header from real Memberstack state (guest | member | pro).
  // Reuses the exact Pro-detection logic from the Pro Library (PRO_PLAN_ID +
  // planConnections check); no custom/fake auth. Memberstack is loaded site-wide,
  // so we poll until its DOM SDK is ready, same as the Library does.
  (function(){
    var PRO_PLAN_ID = 'pln_skymotion-pro-beta-r8ai0gbb';
    function setState(s){ if (typeof window.setAuth === 'function') window.setAuth(s); }
    function isPro(member){
      var conns = member && member.planConnections;
      return Array.isArray(conns) && conns.some(function(pc){
        if (!pc) return false;
        var id = pc.planId || (pc.plan && pc.plan.id);
        if (id !== PRO_PLAN_ID) return false;
        if (pc.active === false) return false;
        if (pc.status && /cancel|expired|inactive|past_due/i.test(String(pc.status))) return false;
        return true;
      });
    }
    function apply(res){
      var d = res && res.data;
      var m = (d && d.member) || d || (res && res.member) || null;
      // A real logged-in member has an id; logged-out Memberstack resolves data:null.
      if (!m || !m.id) { setState('guest'); return; }
      setState(isPro(m) ? 'pro' : 'member');
    }
    function check(){
      var ms = window.$memberstackDom || window.$memberstack;
      if (ms && ms.getCurrentMember){
        ms.getCurrentMember().then(apply).catch(function(){ setState('guest'); });
        return true;
      }
      return false;
    }
    (function resolve(tries){
      if (check()) return;
      if (tries > 0){ setTimeout(function(){ resolve(tries - 1); }, 250); }
      else { setState('guest'); }   // no Memberstack on the page → treat as guest
    })(40);
  })();

  // LOGOUT — real Memberstack logout, then land on "/" in guest state.
  // No dedicated logout page/route; the SDK clears the session in place.
  (function(){
    var btn = document.querySelector('[data-sm-logout]');
    if (!btn) return;
    var LABEL = btn.textContent;
    var busy = false;
    btn.addEventListener('click', function(e){
      e.preventDefault();
      if (busy) return;
      var ms = window.$memberstackDom || window.$memberstack;
      if (!ms || typeof ms.logout !== 'function'){
        console.error('[sm-home] Logout unavailable: Memberstack SDK not found; staying on the page.');
        return;
      }
      busy = true;
      btn.textContent = 'Logging out…';
      btn.setAttribute('aria-busy', 'true');
      Promise.resolve(ms.logout()).then(function(){
        window.location.replace('/');   // landing in guest state
      }).catch(function(err){
        console.error('[sm-home] Logout failed:', err);
        busy = false;
        btn.textContent = LABEL;        // restore "Log out"; do not redirect
        btn.removeAttribute('aria-busy');
      });
    });
  })();

  // CONTACT POPUP — Web3Forms (recipient email never appears in the page)
  (function(){
    var cm = document.getElementById('contactModal');
    if(!cm) return;
    var form = cm.querySelector('#contactForm');
    var msg = cm.querySelector('.cform__msg');
    function open(){ cm.classList.add('open'); cm.setAttribute('aria-hidden','false'); document.body.style.overflow='hidden'; }
    function close(){ cm.classList.remove('open'); cm.setAttribute('aria-hidden','true'); document.body.style.overflow=''; }
    document.querySelectorAll('[data-open-contact]').forEach(function(b){ b.addEventListener('click', function(e){ e.preventDefault(); open(); }); });
    cm.querySelectorAll('[data-cclose]').forEach(function(b){ b.addEventListener('click', close); });
    document.addEventListener('keydown', function(e){ if(e.key === 'Escape' && cm.classList.contains('open')) close(); });
    if(form){
      form.addEventListener('submit', function(e){
        e.preventDefault();
        if(msg){ msg.className = 'cform__msg'; msg.textContent = 'Sending…'; }
        fetch('https://api.web3forms.com/submit', { method:'POST', body:new FormData(form) })
          .then(function(r){ return r.json(); })
          .then(function(res){
            if(res.success){ if(msg){ msg.className='cform__msg ok'; msg.textContent="Thanks — we'll get back to you soon."; } form.reset(); setTimeout(close, 1900); }
            else { if(msg){ msg.className='cform__msg err'; msg.textContent = res.message || 'Something went wrong. Please try again.'; } }
          })
          .catch(function(){ if(msg){ msg.className='cform__msg err'; msg.textContent='Network error. Please try again.'; } });
      });
    }
  })();
