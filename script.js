(function () {
  'use strict';

  const wrap = document.getElementById('carousel');
  const trackWrap = document.querySelector('.track-wrap');
  const track = document.getElementById('track');
  const slides = Array.from(document.querySelectorAll('.slide'));
  const dotsEl = document.getElementById('dots');
  const prev = document.getElementById('prev');
  const next = document.getElementById('next');
  const theme = document.getElementById('theme');

  if (!wrap || !trackWrap || !track || !slides.length) return;

  let index = 0;
  let startX = 0;
  let currentX = 0;
  let startY = 0;
  let dragging = false;
  let horizontal = false;
  let pointerId = null;

  function updateDots() {
    Array.from(dotsEl.children).forEach((dot, i) => {
      dot.classList.toggle('active', i === index);
      dot.setAttribute('aria-current', i === index ? 'true' : 'false');
    });
  }

  function go(nextIndex, animate = true) {
    index = (nextIndex + slides.length) % slides.length;
    track.style.transition = animate ? 'transform .45s cubic-bezier(.22,.8,.25,1)' : 'none';
    track.style.transform = `translate3d(${-index * 100}%,0,0)`;
    updateDots();
  }

  // Dots
  slides.forEach((_, i) => {
    const dot = document.createElement('button');
    dot.type = 'button';
    dot.setAttribute('aria-label', `Go to moment ${i + 1}`);
    dot.addEventListener('click', () => go(i));
    dotsEl.appendChild(dot);
  });

  // Desktop arrow buttons. Explicit click handlers keep them independent of dragging.
  prev.addEventListener('click', function (e) {
    e.preventDefault();
    e.stopPropagation();
    go(index - 1);
  });

  next.addEventListener('click', function (e) {
    e.preventDefault();
    e.stopPropagation();
    go(index + 1);
  });

  // Keyboard support when the carousel is focused.
  wrap.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowLeft') { e.preventDefault(); go(index - 1); }
    if (e.key === 'ArrowRight') { e.preventDefault(); go(index + 1); }
  });
  wrap.tabIndex = 0;

  // One unified pointer gesture: works for touch and desktop mouse.
  trackWrap.addEventListener('pointerdown', function (e) {
    if (e.button !== undefined && e.button !== 0) return;
    pointerId = e.pointerId;
    startX = currentX = e.clientX;
    startY = e.clientY;
    dragging = true;
    horizontal = false;
    trackWrap.classList.add('dragging');
    trackWrap.setPointerCapture?.(pointerId);
  });

  trackWrap.addEventListener('pointermove', function (e) {
    if (!dragging || e.pointerId !== pointerId) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;

    if (!horizontal && Math.abs(dx) > 8) {
      if (Math.abs(dy) > Math.abs(dx)) {
        dragging = false;
        trackWrap.classList.remove('dragging');
        return;
      }
      horizontal = true;
    }

    if (horizontal) {
      currentX = e.clientX;
      const width = trackWrap.clientWidth || 1;
      track.style.transition = 'none';
      track.style.transform = `translate3d(calc(${-index * 100}% + ${dx}px),0,0)`;
      e.preventDefault();
    }
  }, { passive: false });

  function endPointer(e) {
    if (!dragging || (e && e.pointerId !== pointerId)) return;
    const dx = currentX - startX;
    dragging = false;
    trackWrap.classList.remove('dragging');
    try { trackWrap.releasePointerCapture?.(pointerId); } catch (_) {}
    pointerId = null;

    if (horizontal && Math.abs(dx) > 55) {
      go(index + (dx < 0 ? 1 : -1));
    } else {
      go(index);
    }
    horizontal = false;
  }

  trackWrap.addEventListener('pointerup', endPointer);
  trackWrap.addEventListener('pointercancel', endPointer);
  trackWrap.addEventListener('lostpointercapture', function () {
    if (dragging) {
      dragging = false;
      trackWrap.classList.remove('dragging');
      go(index);
    }
  });

  // Theme toggle
  theme.addEventListener('click', function () {
    document.body.classList.toggle('dark');
    theme.textContent = document.body.classList.contains('dark') ? '☀' : '☾';
  });

  // Highlight navigation while scrolling.
  const navLinks = Array.from(document.querySelectorAll('.topbar nav a'));
  const sections = ['home', 'moments', 'letter']
    .map(id => document.getElementById(id))
    .filter(Boolean);

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          navLinks.forEach(a => a.classList.toggle('active', a.getAttribute('href') === `#${entry.target.id}`));
        }
      });
    }, { rootMargin: '-45% 0px -45% 0px' });
    sections.forEach(section => observer.observe(section));
  }

  go(0, false);
})();
