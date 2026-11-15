// PDC60 Learning Portfolio — interactivity
// Everything here is progressive enhancement: without JS the page still
// shows every section in full.
(() => {
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const NAV_H = 76;

  // Scroll the window (never with scrollIntoView, which also moves the page
  // when used on items inside the sticky nav).
  const scrollToEl = (el) => {
    const top = el.getBoundingClientRect().top + window.scrollY - NAV_H;
    window.scrollTo({ top, behavior: reduceMotion ? 'auto' : 'smooth' });
  };

  /* ---------- Module tabs ---------- */
  const modules = $$('section.module').filter((s) => s.id !== 'about');
  const navLabel = (id) => {
    const a = $(`.nav-links a[href="#${id}"]`);
    return a ? a.textContent.trim() : id;
  };

  modules.forEach((section, mi) => {
    const wrap = $('.wrap', section);
    const head = $('.module-head', wrap);
    const titles = $$(':scope > h3.block-title', wrap);
    if (titles.length < 2) return;

    const tabbar = document.createElement('div');
    tabbar.className = 'tabs';
    tabbar.setAttribute('role', 'tablist');
    tabbar.setAttribute('aria-label', head.querySelector('h2').textContent + ' sections');

    const panels = [];
    titles.forEach((h3, i) => {
      const panel = document.createElement('div');
      panel.className = 'panel';
      panel.id = `${section.id}-p${i}`;
      panel.setAttribute('role', 'tabpanel');
      // Move everything from this h3 up to the next h3 into the panel
      let node = h3;
      const group = [];
      while (node && !(node !== h3 && node.matches && node.matches('h3.block-title'))) {
        group.push(node);
        node = node.nextElementSibling;
      }
      wrap.insertBefore(panel, h3);
      group.forEach((n) => panel.appendChild(n));
      h3.classList.add('panel-title');
      panels.push(panel);

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'tab';
      btn.id = `${section.id}-t${i}`;
      btn.setAttribute('role', 'tab');
      btn.setAttribute('aria-controls', panel.id);
      btn.innerHTML = `<small>${String(i + 1).padStart(2, '0')}</small>${h3.textContent}`;
      panel.setAttribute('aria-labelledby', btn.id);
      tabbar.appendChild(btn);
    });
    head.after(tabbar);

    const tabs = $$('.tab', tabbar);
    const select = (i, { focus = false, scroll = false } = {}) => {
      tabs.forEach((t, j) => {
        const on = i === j;
        t.setAttribute('aria-selected', on);
        t.tabIndex = on ? 0 : -1;
        panels[j].hidden = !on;
      });
      tabbar.style.setProperty('--ink-x', tabs[i].offsetLeft + 'px');
      tabbar.style.setProperty('--ink-w', tabs[i].offsetWidth + 'px');
      // keep the chosen tab visible if the bar scrolls sideways
      const t = tabs[i];
      const target = t.offsetLeft - (tabbar.clientWidth - t.offsetWidth) / 2;
      tabbar.scrollTo({ left: Math.max(0, target), behavior: 'auto' });
      $$('.reveal', panels[i]).forEach((el) => el.classList.add('in'));
      animateStats(panels[i]);
      if (focus) t.focus({ preventScroll: true });
      if (scroll && tabbar.getBoundingClientRect().top < NAV_H) scrollToEl(tabbar);
    };

    tabs.forEach((t, i) => {
      t.addEventListener('click', () => select(i));
      t.addEventListener('keydown', (e) => {
        let n = null;
        if (e.key === 'ArrowRight') n = (i + 1) % tabs.length;
        if (e.key === 'ArrowLeft') n = (i - 1 + tabs.length) % tabs.length;
        if (e.key === 'Home') n = 0;
        if (e.key === 'End') n = tabs.length - 1;
        if (n !== null) { e.preventDefault(); select(n, { focus: true }); }
      });
    });

    // "Next" button at the bottom of every panel
    panels.forEach((panel, i) => {
      const foot = document.createElement('div');
      foot.className = 'panel-foot';
      if (i < panels.length - 1) {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'btn ghost';
        b.innerHTML = `Next: ${titles[i + 1].textContent} →`;
        b.addEventListener('click', () => select(i + 1, { scroll: true }));
        foot.appendChild(b);
      } else if (mi < modules.length - 1) {
        const next = modules[mi + 1];
        const a = document.createElement('a');
        a.className = 'btn';
        a.href = '#' + next.id;
        a.innerHTML = `Continue to ${navLabel(next.id)}: ${$('h2', next).textContent} →`;
        foot.appendChild(a);
      } else {
        const a = document.createElement('a');
        a.className = 'btn ghost';
        a.href = '#top';
        a.textContent = 'Back to the start ↑';
        foot.appendChild(a);
      }
      panel.appendChild(foot);
    });

    select(0);
    window.addEventListener('resize', () => {
      const cur = tabs.findIndex((t) => t.getAttribute('aria-selected') === 'true');
      tabbar.style.setProperty('--ink-x', tabs[cur].offsetLeft + 'px');
      tabbar.style.setProperty('--ink-w', tabs[cur].offsetWidth + 'px');
    });
  });

  /* ---------- Reveal on scroll ---------- */
  const revealEls = $$('.reveal');
  if ('IntersectionObserver' in window && !reduceMotion) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.08 });
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add('in'));
  }

  /* ---------- Count-up stats ---------- */
  // Animates the first number inside each stat, keeping prefixes/suffixes
  // such as "~", "/6", " min" or "st" exactly as written.
  function animateStats(root) {
    $$('.stat b', root).forEach((b) => {
      if (b.dataset.done) return;
      b.dataset.done = '1';
      const original = b.textContent;
      const m = original.match(/^(\D*)([\d,]+)(.*)$/);
      if (!m || reduceMotion) return;
      const [, pre, numStr, post] = m;
      const end = parseInt(numStr.replace(/,/g, ''), 10);
      const comma = numStr.includes(',');
      const t0 = performance.now();
      const dur = 900;
      const step = (now) => {
        const p = Math.min(1, (now - t0) / dur);
        const v = Math.round(end * (1 - Math.pow(1 - p, 3)));
        b.textContent = pre + (comma ? v.toLocaleString('en-US') : v) + post;
        if (p < 1) requestAnimationFrame(step); else b.textContent = original;
      };
      requestAnimationFrame(step);
    });
  }
  if ('IntersectionObserver' in window) {
    const so = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { animateStats(e.target); so.unobserve(e.target); } });
    }, { threshold: 0.4 });
    $$('.stats').forEach((s) => so.observe(s));
  }

  /* ---------- Hero stats (counted from the page itself) ---------- */
  const heroStats = $('#hero-stats');
  if (heroStats) {
    const facts = [
      [$$('section.module[id^="m"]').length, 'Modules'],
      [$$('a.btn[target="_blank"]').length, 'Linked outputs'],
      [$$('.compare').length, 'Prompt rewrites'],
      [1, 'Final project'],
    ];
    heroStats.innerHTML = facts
      .map(([n, l]) => `<div class="stat"><b>${n}</b><span>${l}</span></div>`)
      .join('');
    heroStats.classList.add('stats');
    animateStats(heroStats);
  }

  /* ---------- Prompt evolution demo in the hero ---------- */
  // Pulls the real before/after prompts from the page's comparison cards.
  const pairs = $$('.compare').map((c) => {
    const cards = $$('.card', c);
    const section = c.closest('section.module');
    return {
      before: $('blockquote', cards[0])?.textContent.trim(),
      after: $('blockquote', cards[1])?.textContent.trim(),
      src: section ? navLabel(section.id) : '',
    };
  }).filter((p) => p.before && p.after);

  const evoBefore = $('#evo-before');
  const evoAfter = $('#evo-after');
  if (pairs.length && evoBefore) {
    let idx = 0;
    let timer = null;
    let auto = null;
    const show = (i) => {
      idx = (i + pairs.length) % pairs.length;
      const p = pairs[idx];
      clearTimeout(timer);
      $('#evo-src').textContent = `Prompt evolution · ${p.src}`;
      $('#evo-count').textContent = `${idx + 1} / ${pairs.length}`;
      evoBefore.textContent = p.before;
      const text = p.after;
      if (reduceMotion) { evoAfter.textContent = text; return; }
      let k = 0;
      const speed = Math.max(6, Math.min(22, 2600 / text.length));
      const type = () => {
        k += 2;
        evoAfter.innerHTML = '';
        evoAfter.append(text.slice(0, k));
        const c = document.createElement('span');
        c.className = 'caret';
        evoAfter.append(c);
        if (k < text.length) timer = setTimeout(type, speed);
        else evoAfter.textContent = text;
      };
      type();
    };
    const restartAuto = () => {
      clearInterval(auto);
      if (!reduceMotion) auto = setInterval(() => show(idx + 1), 9000);
    };
    $('#evo-next').addEventListener('click', () => { show(idx + 1); restartAuto(); });
    $('#evo-prev').addEventListener('click', () => { show(idx - 1); restartAuto(); });
    show(0);
    restartAuto();
  }

  /* ---------- Copy buttons on prompts ---------- */
  const toast = $('#toast');
  const say = (msg) => {
    toast.textContent = msg;
    toast.classList.add('on');
    clearTimeout(say.t);
    say.t = setTimeout(() => toast.classList.remove('on'), 1800);
  };
  $$('.compare blockquote').forEach((q) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'copy';
    b.textContent = 'Copy';
    b.setAttribute('aria-label', 'Copy this prompt');
    b.addEventListener('click', async () => {
      const text = q.textContent.trim().replace(/^“|”$/g, '');
      try {
        await navigator.clipboard.writeText(text);
        b.textContent = 'Copied ✓';
        say('Prompt copied to clipboard');
      } catch {
        say('Copy not available in this browser');
      }
      setTimeout(() => (b.textContent = 'Copy'), 1600);
    });
    q.parentElement.classList.add('has-copy');
    q.parentElement.appendChild(b);
  });

  /* ---------- Card spotlight (follows the cursor) ---------- */
  if (window.matchMedia('(hover: hover)').matches) {
    document.addEventListener('pointermove', (e) => {
      const card = e.target.closest('.card, .toc a');
      if (!card) return;
      const r = card.getBoundingClientRect();
      card.style.setProperty('--mx', `${e.clientX - r.left}px`);
      card.style.setProperty('--my', `${e.clientY - r.top}px`);
    }, { passive: true });
  }

  /* ---------- Screenshot lightbox ---------- */
  const lb = $('#lightbox');
  const lbImg = $('img', lb);
  const lbCap = $('.lb-cap', lb);
  let lastFocus = null;
  const closeLb = () => {
    lb.hidden = true;
    document.body.classList.remove('no-scroll');
    lastFocus?.focus();
  };
  $$('.shots figure').forEach((fig) => {
    const img = $('img', fig);
    fig.tabIndex = 0;
    fig.setAttribute('role', 'button');
    fig.setAttribute('aria-label', 'Enlarge screenshot: ' + img.alt);
    const open = () => {
      lastFocus = fig;
      lbImg.src = img.src;
      lbImg.alt = img.alt;
      lbCap.textContent = $('figcaption', fig)?.textContent || '';
      lb.hidden = false;
      document.body.classList.add('no-scroll');
      $('.lb-close', lb).focus();
    };
    fig.addEventListener('click', open);
    fig.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } });
  });
  lb.addEventListener('click', (e) => { if (e.target !== lbImg) closeLb(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !lb.hidden) closeLb(); });

  /* ---------- Nav highlight, progress bar, back-to-top ---------- */
  const links = $$('.nav-links a');
  const navList = $('.nav-links');
  const sections = links.map((a) => $(a.getAttribute('href'))).filter(Boolean);
  const bar = $('#progress');
  const toTop = $('#to-top');
  let lastActive;

  function onScroll() {
    const y = window.scrollY;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
    toTop.classList.toggle('on', y > 700);
    $('.nav').classList.toggle('scrolled', y > 10);

    let current = null;
    sections.forEach((s) => { if (s.offsetTop <= y + 120) current = s.id; });
    if (current === lastActive) return;
    lastActive = current;
    links.forEach((a) => {
      const on = a.getAttribute('href') === '#' + current;
      a.classList.toggle('active', on);
      // slide only the nav sideways, never the page
      if (on && navList.scrollWidth > navList.clientWidth) {
        const lr = a.getBoundingClientRect();
        const nr = navList.getBoundingClientRect();
        const left = navList.scrollLeft + (lr.left - nr.left) - (navList.clientWidth - lr.width) / 2;
        navList.scrollTo({ left: Math.max(0, left), behavior: 'auto' });
      }
    });
  }
  let ticking = false;
  window.addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => { onScroll(); ticking = false; });
  }, { passive: true });
  onScroll();
  toTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' }));
})();
