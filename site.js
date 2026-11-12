(function () {
  var root = document.documentElement;

  // Download resume: the claude.ai preview needs its downloads capability;
  // on a normal website (GitHub Pages) the plain download link does the work.
  var dl = null;
  try {
    if (window.claude && typeof window.claude.use === 'function') {
      window.claude.use('downloads').then(function (d) { dl = d; }, function () {});
    }
  } catch (e) {}
  document.querySelectorAll('[data-download]').forEach(function (a) {
    a.addEventListener('click', function (ev) {
      if (!dl) return;
      ev.preventDefault();
      fetch(a.getAttribute('data-download')).then(function (r) { return r.blob(); }).then(function (blob) {
        return dl.save({ filename: 'Simran-Jobanputra-Resume.pdf', data: blob });
      }).catch(function (e) { if (e && (e.code === 'declined' || e.code === 'rate_limited')) return; window.location.href = a.getAttribute('data-download'); });
    });
  });

  // Copy email
  document.querySelectorAll('[data-copy]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var text = btn.getAttribute('data-copy');
      var done = function () { btn.textContent = 'Copied'; setTimeout(function () { btn.textContent = 'Copy email'; }, 1800); };
      var fallback = function () {
        var el = document.getElementById(btn.getAttribute('aria-controls'));
        if (!el) return;
        var r = document.createRange(); r.selectNodeContents(el);
        var s = window.getSelection(); s.removeAllRanges(); s.addRange(r);
        btn.textContent = 'Selected';
      };
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(done, fallback);
        } else { fallback(); }
      } catch (e) { fallback(); }
    });
  });

  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;


  // Looping tile videos: hold on the poster frame for people who prefer less motion
  document.querySelectorAll('video[autoplay]').forEach(function (v) {
    if (reduce) { v.removeAttribute('autoplay'); v.pause(); }
    else { var p = v.play(); if (p && p.catch) p.catch(function () {}); }
  });

  // More work: a small preview window that follows the cursor (mouse only)
  (function () {
    var rows = document.querySelectorAll('.row[data-peek]');
    if (!rows.length || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    var peek = document.createElement('div');
    peek.className = 'peek'; peek.setAttribute('aria-hidden', 'true');
    var pim = document.createElement('img'); pim.alt = ''; pim.decoding = 'async';
    peek.appendChild(pim); document.body.appendChild(peek);
    rows.forEach(function (r) { var i = new Image(); i.src = r.getAttribute('data-peek'); });
    var tx = 0, ty = 0, x = 0, y = 0, raf = 0, on = false;
    function target() {
      var w = peek.offsetWidth, h = peek.offsetHeight;
      var nx = tx + 28, ny = ty - h * 0.55;
      if (nx + w > window.innerWidth - 16) nx = tx - w - 28;
      ny = Math.max(16, Math.min(ny, window.innerHeight - h - 16));
      return [nx, ny];
    }
    function put() { peek.style.transform = 'translate3d(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px,0)'; }
    function tick() {
      var t = target();
      if (reduce) { x = t[0]; y = t[1]; } else { x += (t[0] - x) * 0.2; y += (t[1] - y) * 0.2; }
      put();
      raf = (on && (Math.abs(t[0] - x) > 0.4 || Math.abs(t[1] - y) > 0.4)) ? requestAnimationFrame(tick) : 0;
    }
    function kick() { if (!raf) raf = requestAnimationFrame(tick); }
    rows.forEach(function (r) {
      r.addEventListener('mouseenter', function (e) {
        pim.src = r.getAttribute('data-peek');
        tx = e.clientX; ty = e.clientY;
        if (!on) { var t = target(); x = t[0]; y = t[1]; put(); }
        on = true; peek.classList.add('on'); kick();
      });
      r.addEventListener('mousemove', function (e) { tx = e.clientX; ty = e.clientY; kick(); });
      r.addEventListener('mouseleave', function () { on = false; peek.classList.remove('on'); });
    });
    window.addEventListener('scroll', function () { if (on) { on = false; peek.classList.remove('on'); } }, { passive: true });
  })();

  // Phone clips: "Sound on" unmutes a looping clip from the start; "Hear Ray" plays a clip once with sound
  document.querySelectorAll('.phone .snd').forEach(function (btn) {
    var v = btn.parentElement.querySelector('video');
    if (!v) return;
    var label = btn.querySelector('span');
    if (btn.hasAttribute('data-sound')) {
      btn.addEventListener('click', function () {
        var on = v.muted;
        v.muted = !on;
        if (on) { v.currentTime = 0; var pr = v.play(); if (pr && pr.catch) pr.catch(function () {}); }
        btn.setAttribute('aria-pressed', on ? 'true' : 'false');
        if (label) label.textContent = on ? 'Sound off' : 'Sound on';
      });
    } else if (btn.hasAttribute('data-play')) {
      btn.addEventListener('click', function () {
        v.muted = false; v.currentTime = 0;
        var pr = v.play(); if (pr && pr.catch) pr.catch(function () {});
        btn.classList.add('playing');
      });
      v.addEventListener('click', function () { if (!v.paused) { v.pause(); btn.classList.remove('playing'); } });
      v.addEventListener('ended', function () { btn.classList.remove('playing'); v.load(); });
    }
  });

  // Explorations reel: arrow buttons, and click-and-drag with a mouse
  document.querySelectorAll('[data-reel]').forEach(function (reel) {
    var track = reel.querySelector('.reel-track');
    var nav = reel.querySelector('.reel-nav');
    var btns = reel.querySelectorAll('.reel-btn');
    if (!track) return;
    function step() {
      var card = track.querySelector('.reel-card');
      var gap = parseFloat(getComputedStyle(track).columnGap) || 16;
      return card ? card.getBoundingClientRect().width + gap : track.clientWidth * 0.8;
    }
    function sync() {
      var max = track.scrollWidth - track.clientWidth;
      if (nav) nav.hidden = max <= 4;
      btns.forEach(function (b) {
        var dir = Number(b.getAttribute('data-dir'));
        b.disabled = dir < 0 ? track.scrollLeft <= 4 : track.scrollLeft >= max - 4;
      });
    }
    btns.forEach(function (b) {
      b.addEventListener('click', function () {
        track.scrollBy({ left: Number(b.getAttribute('data-dir')) * step(), behavior: reduce ? 'auto' : 'smooth' });
      });
    });
    track.addEventListener('scroll', function () { window.requestAnimationFrame(sync); }, { passive: true });
    function align() {
      // scroll-padding % resolves against the track, not the page, so copy the real bleed in
      var cs = getComputedStyle(track);
      track.style.scrollPaddingLeft = cs.paddingLeft;
      track.style.scrollPaddingRight = cs.paddingRight;
    }
    window.addEventListener('resize', function () { align(); sync(); });
    align();
    track.scrollLeft = 0;
    sync();

    var down = false, startX = 0, startLeft = 0, moved = false;
    track.addEventListener('pointerdown', function (e) {
      if (e.pointerType !== 'mouse' || e.button !== 0) return;
      down = true; moved = false; startX = e.clientX; startLeft = track.scrollLeft;
    });
    window.addEventListener('pointermove', function (e) {
      if (!down) return;
      var dx = e.clientX - startX;
      if (!moved && Math.abs(dx) > 4) { moved = true; track.classList.add('dragging'); }
      if (moved) track.scrollLeft = startLeft - dx;
    });
    window.addEventListener('pointerup', function () {
      if (!down) return;
      down = false;
      if (moved) {
        var s = step(), target = Math.round(track.scrollLeft / s) * s;
        track.classList.remove('dragging');
        track.scrollTo({ left: target, behavior: reduce ? 'auto' : 'smooth' });
      }
    });
    track.addEventListener('click', function (e) { if (moved) { e.preventDefault(); e.stopPropagation(); moved = false; } }, true);
  });


  // Auto-cycling viewer: the active label and image advance on their own; clicking a label picks one
  document.querySelectorAll('[data-cycle]').forEach(function (box) {
    var tabs = box.querySelectorAll('.cyc-tab'), panes = box.querySelectorAll('.cyc-pane'), i = 0, timer = 0, seen = false;
    function show(n) { i = n; tabs.forEach(function (t, k) { t.classList.toggle('is-on', k === n); t.setAttribute('aria-selected', k === n ? 'true' : 'false'); }); panes.forEach(function (p, k) { p.classList.toggle('is-on', k === n); }); }
    function start() { if (reduce || timer) return; timer = setInterval(function () { show((i + 1) % tabs.length); }, 2600); }
    function stop() { clearInterval(timer); timer = 0; }
    tabs.forEach(function (t, k) { t.addEventListener('click', function () { stop(); show(k); }); });
    if ('IntersectionObserver' in window) { new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { if (!seen) { seen = true; start(); } } else if (seen) { stop(); seen = false; } }); }, { threshold: 0.5 }).observe(box); } else { start(); }
  });

  // Key features: three clips side by side, one in focus and playing; hover or click a phone to focus it
  document.querySelectorAll('[data-kf]').forEach(function (box) {
    var cols = box.querySelectorAll('.kf-col'), i = 0, live = false;
    function vid(n) { return cols[n].querySelector('video'); }
    function show(n) {
      i = n;
      cols.forEach(function (c, k) { c.classList.toggle('on', k === n); var v = vid(k); if (k === n && live) { var p = v.play(); if (p && p.catch) p.catch(function () {}); } else { v.pause(); } });
    }
    if (reduce) { box.classList.add('static'); return; }
    cols.forEach(function (c, k) { c.setAttribute('tabindex', '0'); ['click', 'mouseenter', 'focus'].forEach(function (ev) { c.addEventListener(ev, function () { if (k !== i) show(k); }); }); });
    if ('IntersectionObserver' in window) { new IntersectionObserver(function (es) { es.forEach(function (e) { live = e.isIntersecting; show(i); }); }, { threshold: 0.3 }).observe(box); } else { live = true; show(0); }
  });

  // Video feed clips: open the YouTube clip in an overlay
  document.querySelectorAll('[data-ytm]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var prev = document.activeElement;
      var o = document.createElement('div'); o.className = 'op-zoom yt-modal'; o.setAttribute('role', 'dialog'); o.setAttribute('aria-label', btn.getAttribute('data-title'));
      var f = document.createElement('iframe');
      f.src = 'https://www.youtube-nocookie.com/embed/' + btn.getAttribute('data-ytm') + '?autoplay=1&rel=0';
      f.title = btn.getAttribute('data-title'); f.allow = 'autoplay; encrypted-media; picture-in-picture'; f.allowFullscreen = true;
      var x = document.createElement('button'); x.type = 'button'; x.setAttribute('aria-label', 'Close'); x.textContent = '×';
      o.appendChild(f); o.appendChild(x);
      var close = function () { o.remove(); document.removeEventListener('keydown', onKey); document.documentElement.style.overflow = ''; if (prev && prev.focus) prev.focus(); };
      var onKey = function (e) { if (e.key === 'Escape') close(); };
      o.addEventListener('click', function (e) { if (e.target !== f) close(); });
      document.addEventListener('keydown', onKey); document.documentElement.style.overflow = 'hidden';
      document.body.appendChild(o); x.focus();
    });
  });

  // Original Hopper pages: tabbed key features and click-to-play YouTube
  document.querySelectorAll('[data-tabs]').forEach(function (box) {
    var tabs = box.querySelectorAll('.op-tab'), panes = box.querySelectorAll('.op-pane');
    tabs.forEach(function (t) {
      t.addEventListener('click', function () {
        var k = t.getAttribute('data-tab');
        tabs.forEach(function (x) { var on = x === t; x.classList.toggle('is-on', on); x.setAttribute('aria-selected', on ? 'true' : 'false'); });
        panes.forEach(function (p) { p.classList.toggle('is-on', p.getAttribute('data-pane') === k); });
      });
    });
  });
  document.querySelectorAll('.op-yt').forEach(function (box) {
    var btn = box.querySelector('.op-yt-play');
    if (!btn) return;
    btn.addEventListener('click', function () {
      var f = document.createElement('iframe');
      f.src = 'https://www.youtube-nocookie.com/embed/' + box.getAttribute('data-yt') + '?autoplay=1&rel=0';
      f.title = box.getAttribute('data-title') || 'Video';
      f.allow = 'autoplay; encrypted-media; picture-in-picture';
      f.allowFullscreen = true;
      box.innerHTML = '';
      box.appendChild(f);
    });
  });


  // Click to enlarge images on the original Hopper pages
  var zoomables = document.querySelectorAll('.op .op-gal img, .op .op-fig img, .op .op-opt-img img, .op .deck-split > img, .op .deck-body > img, .slide-grid img, .deck.dv img');
  zoomables.forEach(function (im) {
    im.setAttribute('tabindex', '0');
    im.setAttribute('role', 'button');
    var open = function () {
      var prev = document.activeElement;
      var o = document.createElement('div');
      o.className = 'op-zoom';
      o.setAttribute('role', 'dialog');
      o.setAttribute('aria-label', im.alt || 'Enlarged image');
      var big = document.createElement('img');
      big.src = im.currentSrc || im.src; big.alt = im.alt || '';
      var x = document.createElement('button');
      x.type = 'button'; x.setAttribute('aria-label', 'Close'); x.textContent = '×';
      o.appendChild(big); o.appendChild(x);
      var close = function () { o.remove(); document.removeEventListener('keydown', onKey); document.documentElement.style.overflow = ''; if (prev && prev.focus) prev.focus(); };
      var onKey = function (e) { if (e.key === 'Escape') close(); };
      o.addEventListener('click', close);
      document.addEventListener('keydown', onKey);
      document.documentElement.style.overflow = 'hidden';
      document.body.appendChild(o);
      x.focus();
    };
    im.addEventListener('click', open);
    im.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } });
  });

  // Before/after callouts come in as they scroll into view
  (function () {
    var items = document.querySelectorAll('[data-calls] li');
    if (!items.length) return;
    if (!('IntersectionObserver' in window)) { items.forEach(function (li) { li.classList.add('in'); }); return; }
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }); }, { rootMargin: '0px 0px -18% 0px' });
    items.forEach(function (li) { io.observe(li); });
  })();

  // Gentle parallax on case study covers
  var items = Array.prototype.slice.call(document.querySelectorAll('[data-parallax]'));
  if (reduce || !items.length) return;
  var ticking = false;
  function update() {
    var vh = window.innerHeight || 800;
    items.forEach(function (el) {
      var box = el.parentElement.getBoundingClientRect();
      if (box.bottom < 0 || box.top > vh) return;
      var speed = parseFloat(el.getAttribute('data-parallax')) || 0.06;
      var offset = (box.top + box.height / 2 - vh / 2) * speed;
      el.style.transform = 'translate3d(0,' + offset.toFixed(1) + 'px,0)';
    });
    ticking = false;
  }
  window.addEventListener('scroll', function () {
    if (!ticking) { ticking = true; requestAnimationFrame(update); }
  }, { passive: true });
  update();

})();
