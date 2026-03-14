// event.js — 202605.html widgets (countdown, faq)
(function(){
  // Countdown to 2026-05-30 10:00:00 JST
  const target = new Date('2026-05-30T10:00:00+09:00').getTime();
  const els = {
    d: document.querySelector('[data-count="days"]'),
    h: document.querySelector('[data-count="hours"]'),
    m: document.querySelector('[data-count="minutes"]'),
    s: document.querySelector('[data-count="seconds"]')
  };
  function pad(n){ return String(n).padStart(2,'0'); }
  function tick(){
    const now = Date.now();
    let diff = Math.max(0, target - now);
    const days = Math.floor(diff / (1000*60*60*24)); diff -= days*(1000*60*60*24);
    const hours = Math.floor(diff / (1000*60*60)); diff -= hours*(1000*60*60);
    const minutes = Math.floor(diff / (1000*60)); diff -= minutes*(1000*60);
    const seconds = Math.floor(diff / 1000);
    if(els.d) els.d.textContent = days;
    if(els.h) els.h.textContent = pad(hours);
    if(els.m) els.m.textContent = pad(minutes);
    if(els.s) els.s.textContent = pad(seconds);
  }
  tick();
  setInterval(tick, 1000);

  // FAQ accordion
  document.querySelectorAll('.faq-item .faq-q').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = btn.closest('.faq-item');
      item.classList.toggle('open');
    });
  });
})();
