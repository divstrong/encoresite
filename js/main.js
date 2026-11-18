/* ChangeServant: site interactions (no dependencies) */
(function () {
  'use strict';

  var doc = document.documentElement;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* ---------- Intro animation ---------- */
  requestAnimationFrame(function () {
    requestAnimationFrame(function () { doc.classList.add('loaded'); });
  });

  /* ---------- Current year ---------- */
  $$('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });

  /* ---------- Header state ---------- */
  var header = $('.site-header');
  var onScroll = function () { header.classList.toggle('scrolled', window.scrollY > 20); };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ---------- Mobile nav ---------- */
  var toggle = $('.nav-toggle');
  var setNav = function (open) {
    doc.classList.toggle('nav-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  };
  toggle.addEventListener('click', function () { setNav(!doc.classList.contains('nav-open')); });
  $$('.nav a').forEach(function (a) { a.addEventListener('click', function () { setNav(false); }); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setNav(false); });

  /* ---------- Active nav link ---------- */
  var navLinks = $$('.nav ul a');
  if ('IntersectionObserver' in window) {
    var secObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        navLinks.forEach(function (l) { l.classList.toggle('active', l.getAttribute('href') === '#' + en.target.id); });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    navLinks.forEach(function (l) { var s = $(l.getAttribute('href')); if (s) secObs.observe(s); });
  }

  /* ---------- Scroll reveal ---------- */
  var revealEls = $$('[data-reveal], [data-steps]');
  if ('IntersectionObserver' in window && !reduceMotion) {
    var revObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('is-in'); revObs.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    revealEls.forEach(function (el) { revObs.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('is-in'); });
  }

  /* ---------- Count-up stats ---------- */
  var counters = $$('[data-count]');
  var runCount = function (el) {
    var target = parseInt(el.getAttribute('data-count'), 10);
    var start = null, dur = 1600;
    var step = function (t) {
      if (!start) start = t;
      var p = Math.min((t - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 4);
      el.textContent = Math.round(target * eased);
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };
  if ('IntersectionObserver' in window && !reduceMotion) {
    counters.forEach(function (el) { el.textContent = '0'; });
    var cObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { runCount(en.target); cObs.unobserve(en.target); }
      });
    }, { threshold: 0.6 });
    counters.forEach(function (el) { cObs.observe(el); });
  }

  /* ---------- Marquee: duplicate track for a seamless loop ---------- */
  var track = $('.marquee-track');
  if (track && !reduceMotion) track.innerHTML += track.innerHTML;

  /* ---------- Hero parallax (pointer) ---------- */
  var stage = $('.portrait-stage');
  var finePointer = window.matchMedia('(pointer: fine)').matches;
  if (stage && finePointer && !reduceMotion) {
    var layers = $$('[data-depth]', stage);
    var hero = $('.hero');
    var raf = null, mx = 0, my = 0;
    hero.addEventListener('pointermove', function (e) {
      var r = hero.getBoundingClientRect();
      mx = (e.clientX - r.left) / r.width - 0.5;
      my = (e.clientY - r.top) / r.height - 0.5;
      if (!raf) raf = requestAnimationFrame(function () {
        layers.forEach(function (l) {
          var d = parseFloat(l.getAttribute('data-depth'));
          l.style.transform = 'translate3d(' + (mx * d).toFixed(1) + 'px,' + (my * d).toFixed(1) + 'px,0)';
        });
        raf = null;
      });
    });
    hero.addEventListener('pointerleave', function () {
      layers.forEach(function (l) { l.style.transform = ''; });
    });
  }

  /* ---------- Card spotlight ---------- */
  if (finePointer) {
    $$('.card').forEach(function (card) {
      card.addEventListener('pointermove', function (e) {
        var r = card.getBoundingClientRect();
        card.style.setProperty('--mx', (e.clientX - r.left) + 'px');
        card.style.setProperty('--my', (e.clientY - r.top) + 'px');
      });
    });
  }

  /* ---------- Quote rotator ---------- */
  var quotes = $$('.quote');
  var dotsWrap = $('.quote-dots');
  if (quotes.length && dotsWrap) {
    var qi = 0, qTimer = null;
    var dots = quotes.map(function (q, i) {
      var b = document.createElement('button');
      b.type = 'button';
      b.setAttribute('role', 'tab');
      b.setAttribute('aria-label', 'Quote ' + (i + 1));
      b.setAttribute('aria-selected', i === 0 ? 'true' : 'false');
      b.addEventListener('click', function () { show(i); restart(); });
      dotsWrap.appendChild(b);
      return b;
    });
    var show = function (i) {
      qi = (i + quotes.length) % quotes.length;
      quotes.forEach(function (q, k) {
        q.classList.toggle('is-active', k === qi);
        q.setAttribute('aria-hidden', k === qi ? 'false' : 'true');
      });
      dots.forEach(function (d, k) { d.setAttribute('aria-selected', k === qi ? 'true' : 'false'); });
    };
    var restart = function () {
      clearInterval(qTimer);
      if (!reduceMotion) qTimer = setInterval(function () { show(qi + 1); }, 7000);
    };
    var qSection = $('.quotes');
    qSection.addEventListener('mouseenter', function () { clearInterval(qTimer); });
    qSection.addEventListener('mouseleave', restart);
    show(0); restart();
  }

  /* ---------- Publication filters ---------- */
  var chips = $$('.chip');
  var pubs = $$('.pub-list li');
  chips.forEach(function (chip) {
    chip.addEventListener('click', function () {
      var f = chip.getAttribute('data-filter');
      chips.forEach(function (c) {
        var on = c === chip;
        c.classList.toggle('is-active', on);
        c.setAttribute('aria-pressed', String(on));
      });
      pubs.forEach(function (li) { li.classList.toggle('is-hidden', f !== 'all' && li.getAttribute('data-cat') !== f); });
    });
  });

  /* ---------- Latest blog posts (Blogger JSONP feed) ---------- */
  var blogGrid = $('#blog-grid');
  if (blogGrid) {
    var fallback = blogGrid.innerHTML;
    var skeleton = '';
    for (var s = 0; s < 3; s++) {
      skeleton += '<div class="post skeleton"><span class="post-meta">Loading date</span><span class="post-title">Loading the latest post title here</span><span class="post-excerpt">Loading excerpt text for this post…</span></div>';
    }
    var blogLoaded = false;
    var startBlog = function () {
      if (blogLoaded) return;
      blogLoaded = true;
      blogGrid.innerHTML = skeleton;
      var timeout = setTimeout(function () { blogGrid.innerHTML = fallback; }, 8000);

      window.csBlogFeed = function (data) {
        clearTimeout(timeout);
        var entries = (data && data.feed && data.feed.entry) || [];
        if (!entries.length) { blogGrid.innerHTML = fallback; return; }
        blogGrid.innerHTML = '';
        entries.slice(0, 3).forEach(function (e) {
          var link = (e.link || []).filter(function (l) { return l.rel === 'alternate'; })[0];
          if (!link) return;
          var raw = (e.summary && e.summary.$t) || (e.content && e.content.$t) || '';
          var tmp = document.createElement('div');
          tmp.innerHTML = raw.replace(/<(script|style|img|iframe)[\s\S]*?>/gi, ' ');
          var text = (tmp.textContent || '').replace(/\s+/g, ' ').trim();
          var date = new Date(e.published.$t);

          var a = document.createElement('a');
          a.className = 'post';
          a.href = link.href;
          a.target = '_blank';
          a.rel = 'noopener';
          var meta = document.createElement('span');
          meta.className = 'post-meta';
          meta.textContent = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
          var title = document.createElement('span');
          title.className = 'post-title';
          title.textContent = e.title.$t;
          var ex = document.createElement('span');
          ex.className = 'post-excerpt';
          ex.textContent = text.length > 180 ? text.slice(0, 180).replace(/\s\S*$/, '') + '…' : text;
          var go = document.createElement('span');
          go.className = 'post-go';
          go.innerHTML = '<svg class="i"><use href="#i-up-right"/></svg>';
          a.appendChild(meta); a.appendChild(title);
          if (text) a.appendChild(ex);
          a.appendChild(go);
          blogGrid.appendChild(a);
        });
      };
      var sc = document.createElement('script');
      sc.src = 'https://changeservant.blogspot.com/feeds/posts/default?alt=json-in-script&max-results=3&callback=csBlogFeed';
      sc.async = true;
      sc.onerror = function () { clearTimeout(timeout); blogGrid.innerHTML = fallback; };
      document.body.appendChild(sc);
    };
    if ('IntersectionObserver' in window) {
      var bObs = new IntersectionObserver(function (en) {
        if (en[0].isIntersecting) { startBlog(); bObs.disconnect(); }
      }, { rootMargin: '600px 0px' });
      bObs.observe(blogGrid);
    } else { startBlog(); }
  }

  /* ---------- Contact form fallback (if the Cognito embed doesn't render) ---------- */
  var cogWrap = $('.cognito-wrap');
  var formFallback = $('.form-fallback');
  if (cogWrap && formFallback) {
    setTimeout(function () {
      if (!cogWrap.querySelector('input, textarea, select')) {
        cogWrap.classList.add('is-failed');
        formFallback.hidden = false;
        var card = cogWrap.closest('.form-card');
        $('h3', card).textContent = 'Start a conversation';
        $('.form-note', card).hidden = true;
      }
    }, 6000);
  }

  /* ---------- Legal dialog ---------- */
  var dlg = $('#legal');
  if (dlg && typeof dlg.showModal === 'function') {
    $$('[data-legal]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        dlg.showModal();
        var target = $('#' + btn.getAttribute('data-legal'), dlg);
        if (target) target.scrollIntoView({ block: 'start' });
      });
    });
    $('.legal-close', dlg).addEventListener('click', function () { dlg.close(); });
    dlg.addEventListener('click', function (e) { if (e.target === dlg) dlg.close(); });
  }
})();
