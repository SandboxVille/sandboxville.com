/* site.js: moved out of index.html so the Content-Security-Policy can forbid inline scripts. */
/* Inline "Watch it" video: plays a real, self-hosted 15s clip of SandboxVille in a lightbox
   instead of leaving the page. No YouTube, no outside request. Falls back to the plain
   video file link (opens/plays in a new tab) if JS can't run. */
(function(){
  var link = document.getElementById('watch-link');
  var heroPlay = document.getElementById('watch-link-hero');
  var modal = document.getElementById('video-modal');
  var embed = document.getElementById('video-embed');
  if (!modal || !embed || (!link && !heroPlay)) return;
  var VIDEO_SRC = 'media/sandboxville-15s.mp4';
  var VIDEO_POSTER = 'media/sandboxville-15s-poster.jpg';
  var lastTrigger = null;
  function openModal(trigger){
    lastTrigger = trigger || link || heroPlay;
    embed.innerHTML = '<video src="' + VIDEO_SRC + '" poster="' + VIDEO_POSTER + '" controls autoplay muted playsinline title="SandboxVille walkthrough"></video>';
    modal.hidden = false;
    document.body.style.overflow = 'hidden';
    modal.querySelector('.video-modal-close').focus();
  }
  function closeModal(){
    modal.hidden = true;
    embed.innerHTML = '';
    document.body.style.overflow = '';
    if (lastTrigger) lastTrigger.focus();
  }
  if (link) link.addEventListener('click', function(e){
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1) return; /* let it open in a new tab as usual */
    e.preventDefault();
    openModal(link);
  });
  if (heroPlay) heroPlay.addEventListener('click', function(){
    openModal(heroPlay);
  });
  modal.addEventListener('click', function(e){
    if (e.target.hasAttribute('data-close')) closeModal();
  });
  document.addEventListener('keydown', function(e){
    if (e.key === 'Escape' && !modal.hidden) closeModal();
  });
})();
/* Daily visitors bar: real counts from GoatCounter's public counter (cached by GoatCounter for up to 4 hours).
   Stays hidden if the counter is unreachable, so the page never shows a fake or broken number. */
(function(){
  var GC = 'https://sandboxville.goatcounter.com/counter/TOTAL.json';
  var today = new Date().toISOString().slice(0, 10);
  var bar = document.getElementById('visitors-bar');
  var numbers = document.getElementById('vb-numbers');
  var fallback = document.getElementById('vb-fallback');
  var numbersShown = false;
  function get(q){ return fetch(GC + q, {cache: 'no-store'}).then(function(r){ if (!r.ok) throw new Error(r.status); return r.json(); }); }
  function n(j){ return (j && (j.count_unique || j.count)) || '0'; }
  function showNumbers(a){
    document.getElementById('vb-today').textContent = n(a[0]);
    document.getElementById('vb-week').textContent = n(a[1]);
    numbers.hidden = false;
    fallback.hidden = true;
    bar.hidden = false;
    numbersShown = true;
  }
  function showFallback(){
    if (numbersShown) return; /* real counts already landed, prefer those */
    fallback.hidden = false;
    bar.hidden = false;
  }
  /* Real counts are the goal; if GoatCounter is slow or blocked (privacy
     extensions, ad blockers), show a neutral label instead of an empty gap. */
  setTimeout(showFallback, 2500);
  Promise.all([get('?start=' + today), get('?start=week')]).then(showNumbers).catch(showFallback);
})();
/* Motion (v6): real-screenshot planes in the hero, a sideways hallway of rooms, and the
   "read the door, then it opens" peak. Transform/opacity only, one rAF-throttled scroll
   handler, nothing runs for prefers-reduced-motion. Without JS the page is complete:
   the rooms rail scrolls sideways natively and the Security Office wall is shown open. */
(function(){
  var root = document.documentElement;
  var mqReduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var mqWide = window.matchMedia('(min-width: 960px)');
  var mqFine = window.matchMedia('(hover: hover) and (pointer: fine)');
  if (mqReduce.matches) return;
  root.classList.add('js-motion');

  function clamp(v, a, b){ return v < a ? a : (v > b ? b : v); }
  function easeInOut(t){ return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }

  /* 1. reveal-on-entry, once */
  var ins = document.querySelectorAll('[data-in]');
  if ('IntersectionObserver' in window){
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(e){ if (e.isIntersecting){ e.target.classList.add('is-in'); io.unobserve(e.target); } });
    }, {rootMargin: '0px 0px -10% 0px', threshold: 0.12});
    ins.forEach(function(el){ io.observe(el); });
  } else {
    ins.forEach(function(el){ el.classList.add('is-in'); });
  }

  /* 2. hero depth: far plane pushes in and lags, the sign and the wall crop rise faster */
  var hero = document.querySelector('[data-hero]');
  var far = hero && hero.querySelector('[data-depth="far"]');
  var mid = hero && hero.querySelector('[data-depth="mid"]');
  var near = hero && hero.querySelector('[data-depth="near"]');
  var ptr = {tx: 0, ty: 0, x: 0, y: 0};
  if (hero && mqFine.matches){
    window.addEventListener('pointermove', function(e){
      ptr.tx = (e.clientX / window.innerWidth) * 2 - 1;
      ptr.ty = (e.clientY / window.innerHeight) * 2 - 1;
      kick();
    }, {passive: true});
  }

  /* 3. rooms hallway: vertical scroll drives a sideways pan on wide screens */
  var pan = document.querySelector('[data-pan]');
  var rail = pan && pan.querySelector('.rail');
  var railView = pan && pan.querySelector('.rail-viewport');
  var panOverflow = 0;

  /* 4. the peak: read the sign, doors part, the wall shows the refusal */
  var peak = document.querySelector('[data-peak]');
  var doorL = peak && peak.querySelector('.door-l');
  var doorR = peak && peak.querySelector('.door-r');
  var edges = peak ? peak.querySelectorAll('.door-edge') : [];
  var inside = peak && peak.querySelector('.peak-inside');
  var readBar = peak && peak.querySelector('.read-bar');
  var refused = peak && peak.querySelector('.refused-box');
  var beats = peak ? peak.querySelectorAll('.beat') : [];
  var openIO = null;

  function setup(){
    var wide = mqWide.matches;
    if (pan && rail){
      root.classList.remove('js-pan');
      pan.style.height = '';
      rail.style.transform = '';
      if (wide){
        root.classList.add('js-pan');
        panOverflow = rail.scrollWidth - window.innerWidth;
        if (panOverflow < 60){ root.classList.remove('js-pan'); panOverflow = 0; }
        else {
          pan.style.height = (window.innerHeight + panOverflow) + 'px';
          if (railView) railView.setAttribute('tabindex', '-1');
        }
      } else if (railView){ railView.setAttribute('tabindex', '0'); }
    }
    if (peak){
      root.classList.remove('js-peak', 'js-open');
      [doorL, doorR, inside, readBar, refused].forEach(function(el){ if (el){ el.style.transform = ''; el.style.opacity = ''; } });
      beats.forEach(function(b, i){ b.classList.toggle('on', i === 0); });
      if (openIO){ openIO.disconnect(); openIO = null; }
      if (wide){
        root.classList.add('js-peak');
      } else if ('IntersectionObserver' in window){
        root.classList.add('js-open');
        var frameEl = peak.querySelector('.peak-frame');
        openIO = new IntersectionObserver(function(entries){
          entries.forEach(function(e){ if (e.isIntersecting){ peak.classList.add('is-open'); openIO.disconnect(); } });
        }, {threshold: 0.6});
        openIO.observe(frameEl);
      }
    }
    update();
  }

  var ticking = false;
  function kick(){ if (!ticking){ ticking = true; requestAnimationFrame(onFrame); } }
  function onFrame(){ ticking = false; update(); }

  function update(){
    var vh = window.innerHeight;
    /* read every rect first, then write, so no layout thrash */
    var hr = hero ? hero.getBoundingClientRect() : null;
    var pr = (pan && root.classList.contains('js-pan')) ? pan.getBoundingClientRect() : null;
    var kr = (peak && root.classList.contains('js-peak')) ? peak.getBoundingClientRect() : null;
    var again = false;

    if (hr && hr.bottom > 0){
      var p = clamp(-hr.top / Math.max(1, hr.height), 0, 1);
      ptr.x += (ptr.tx - ptr.x) * 0.08;
      ptr.y += (ptr.ty - ptr.y) * 0.08;
      if (Math.abs(ptr.tx - ptr.x) > 0.001 || Math.abs(ptr.ty - ptr.y) > 0.001) again = true;
      var wideNow = mqWide.matches;
      if (far) far.style.transform = 'translate3d(' + (ptr.x * -7).toFixed(2) + 'px,' + (p * 70 + ptr.y * -5).toFixed(2) + 'px,0) scale(' + (1 + p * 0.08).toFixed(4) + ')';
      if (mid) mid.style.transform = 'translate3d(' + (ptr.x * -15).toFixed(2) + 'px,' + ((wideNow ? -p * 110 : -p * 40) + ptr.y * -9).toFixed(2) + 'px,0)';
      if (near) near.style.transform = 'translate3d(' + (ptr.x * -24).toFixed(2) + 'px,' + (-p * 190 + ptr.y * -14).toFixed(2) + 'px,0)';
    }
    if (pr && rail && panOverflow > 0){
      var pp = clamp(-pr.top / panOverflow, 0, 1);
      rail.style.transform = 'translate3d(' + (-pp * panOverflow).toFixed(1) + 'px,0,0)';
    }
    if (kr){
      var travel = Math.max(1, kr.height - vh);
      var k = clamp(-kr.top / travel, 0, 1);
      var read = clamp(k / 0.22, 0, 1);
      var open = easeInOut(clamp((k - 0.30) / 0.36, 0, 1));
      var wall = clamp((k - 0.72) / 0.1, 0, 1);
      if (readBar){ readBar.style.transform = 'scaleX(' + read.toFixed(3) + ')'; readBar.style.opacity = clamp(1 - open * 3, 0, 1).toFixed(3); }
      if (doorL) doorL.style.transform = 'translate3d(' + (-open * 101).toFixed(2) + '%,0,0)';
      if (doorR) doorR.style.transform = 'translate3d(' + (open * 101).toFixed(2) + '%,0,0)';
      var edge = Math.sin(Math.PI * open).toFixed(3);
      for (var i = 0; i < edges.length; i++) edges[i].style.opacity = edge;
      if (inside) inside.style.transform = 'scale(' + (1.12 - 0.12 * open).toFixed(4) + ')';
      if (refused) refused.style.opacity = wall.toFixed(3);
      var active = k < 0.3 ? 0 : (k < 0.7 ? 1 : 2);
      for (var j = 0; j < beats.length; j++) beats[j].classList.toggle('on', j === active);
    }
    if (again) kick();
  }

  /* keyboard: a focused link inside the panned rail scrolls the page so its panel is on screen */
  if (rail){
    rail.addEventListener('focusin', function(e){
      if (!root.classList.contains('js-pan') || !panOverflow) return;
      var panel = e.target.closest('.panel');
      if (!panel) return;
      var want = clamp(panel.offsetLeft - 40, 0, panOverflow);
      var top = pan.getBoundingClientRect().top + window.scrollY;
      window.scrollTo(0, top + want);
    });
  }

  window.addEventListener('scroll', kick, {passive: true});
  var rt = null;
  window.addEventListener('resize', function(){ clearTimeout(rt); rt = setTimeout(setup, 150); });
  if (mqWide.addEventListener) mqWide.addEventListener('change', setup);
  window.addEventListener('load', setup);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(setup);
  setup();
})();
