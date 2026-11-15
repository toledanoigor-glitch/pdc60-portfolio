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

function setActive() {
  const y = window.scrollY + 120;
  let current = null;
  sections.forEach((s) => { if (s.offsetTop <= y) current = s.id; });
  links.forEach((a) => {
    const on = a.getAttribute('href') === '#' + current;
    a.classList.toggle('active', on);
    if (on) a.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  });
}
window.addEventListener('scroll', setActive, { passive: true });
setActive();
