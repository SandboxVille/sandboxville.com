/* rooms.js: search + filter for the Rooms gallery. No inline scripts (CSP: script-src 'self'). */
(function(){
  var grid = document.getElementById('room-grid');
  if (!grid) return; /* detail pages don't have a grid; nothing to do */
  var cards = Array.prototype.slice.call(grid.querySelectorAll('.room-card'));
  var searchInput = document.getElementById('room-search');
  var touchChips = Array.prototype.slice.call(document.querySelectorAll('[data-touch-filter]'));
  var statusChips = Array.prototype.slice.call(document.querySelectorAll('[data-status-filter]'));
  var resultsLine = document.getElementById('results-line');
  var noResults = document.getElementById('no-results');
  var state = { q: '', touch: 'all', status: 'all' };

  function setPressed(chips, value){
    chips.forEach(function(c){
      c.setAttribute('aria-pressed', c.getAttribute('data-touch-filter') === value || c.getAttribute('data-status-filter') === value ? 'true' : 'false');
    });
  }

  function apply(){
    var q = state.q.trim().toLowerCase();
    var shown = 0;
    cards.forEach(function(card){
      var text = (card.getAttribute('data-search') || '').toLowerCase();
      var touch = card.getAttribute('data-touch') || '';
      var status = card.getAttribute('data-status') || '';
      var matchQ = !q || text.indexOf(q) !== -1;
      var matchTouch = state.touch === 'all' || touch === state.touch;
      var matchStatus = state.status === 'all' || status === state.status;
      var match = matchQ && matchTouch && matchStatus;
      card.style.display = match ? '' : 'none';
      if (match) shown++;
    });
    if (resultsLine){
      resultsLine.innerHTML = 'Showing <strong>' + shown + '</strong> of <strong>' + cards.length + '</strong> rooms';
    }
    if (noResults) noResults.classList.toggle('show', shown === 0);
  }

  if (searchInput){
    searchInput.addEventListener('input', function(){
      state.q = searchInput.value;
      apply();
    });
  }
  touchChips.forEach(function(chip){
    chip.addEventListener('click', function(){
      state.touch = chip.getAttribute('data-touch-filter');
      setPressed(touchChips, state.touch);
      apply();
    });
  });
  statusChips.forEach(function(chip){
    chip.addEventListener('click', function(){
      state.status = chip.getAttribute('data-status-filter');
      setPressed(statusChips, state.status);
      apply();
    });
  });

  apply();
})();
