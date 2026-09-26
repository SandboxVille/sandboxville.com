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
