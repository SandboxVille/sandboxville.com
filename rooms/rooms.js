/* rooms.js: the screenshot galleries on the Rooms page. No inline scripts (CSP: script-src 'self').
   Each gallery is a sideways scroll strip that works with a swipe, a trackpad or the keyboard on its own;
   this adds the arrow buttons and the "2 / 5" counter. */
(function(){
  var galleries = Array.prototype.slice.call(document.querySelectorAll('[data-gallery]'));
  galleries.forEach(function(g){
    var track = g.querySelector('.gal-track');
    var nav = g.querySelector('.gal-nav');
    var count = g.querySelector('.gal-count');
    if (!track || !nav) return;
    var slides = Array.prototype.slice.call(track.querySelectorAll('.gal-slide'));
    if (slides.length < 2) return;
    nav.hidden = false;
    function current(){
      var w = track.clientWidth || 1;
      return Math.max(0, Math.min(slides.length - 1, Math.round(track.scrollLeft / w)));
    }
    function show(){ if (count) count.textContent = (current() + 1) + ' / ' + slides.length; }
    function go(i){
      i = Math.max(0, Math.min(slides.length - 1, i));
      track.scrollTo({ left: i * track.clientWidth, behavior: 'smooth' });
    }
    Array.prototype.slice.call(nav.querySelectorAll('.gal-btn')).forEach(function(b){
      b.addEventListener('click', function(){ go(current() + parseInt(b.getAttribute('data-dir'), 10)); });
    });
    track.addEventListener('keydown', function(e){
      if (e.key === 'ArrowRight') { e.preventDefault(); go(current() + 1); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); go(current() - 1); }
    });
    var t = null;
    track.addEventListener('scroll', function(){ if (t) clearTimeout(t); t = setTimeout(show, 60); }, { passive: true });
    show();
  });
})();
