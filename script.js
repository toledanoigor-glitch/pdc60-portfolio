// Fade sections in as they scroll into view
const revealEls = document.querySelectorAll('.reveal');
if ('IntersectionObserver' in window) {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add('in');
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.08 });
  revealEls.forEach((el) => io.observe(el));
} else {
  revealEls.forEach((el) => el.classList.add('in'));
}

// Highlight the nav link for the section on screen
const links = [...document.querySelectorAll('.nav-links a')];
const sections = links
  .map((a) => document.querySelector(a.getAttribute('href')))
  .filter(Boolean);

const navList = document.querySelector('.nav-links');
let lastActive = null;

function setActive() {
  const y = window.scrollY + 120;
  let current = null;
  sections.forEach((s) => { if (s.offsetTop <= y) current = s.id; });
  if (current === lastActive) return;
  lastActive = current;
  links.forEach((a) => {
    const on = a.getAttribute('href') === '#' + current;
    a.classList.toggle('active', on);
    // Keep the active link visible in the nav bar by scrolling only the
    // nav sideways, never the page (scrollIntoView moved the page up).
    if (on && navList && navList.scrollWidth > navList.clientWidth) {
      const linkBox = a.getBoundingClientRect();
      const navBox = navList.getBoundingClientRect();
      const left = navList.scrollLeft + (linkBox.left - navBox.left)
        - (navList.clientWidth - linkBox.width) / 2;
      navList.scrollTo({ left: Math.max(0, left), behavior: 'auto' });
    }
  });
}
window.addEventListener('scroll', setActive, { passive: true });
setActive();
