/* One viewer, using the source-faithful images already present in the document. */
(() => {
  const slides = [...document.querySelectorAll('.presentation-slide')].map(section => section.querySelector('figure img'));
  if (!slides.length) return;
  const dialog = document.createElement('dialog');
  dialog.className = 'slide-viewer';
  dialog.setAttribute('aria-labelledby', 'slide-viewer-title');
  dialog.innerHTML = '<header class="slide-viewer__bar"><h2 id="slide-viewer-title">Original presentation slides</h2><button type="button" class="button button-outline" data-slide-close>Close</button></header><img class="slide-viewer__image" alt=""><footer class="slide-viewer__controls"><button type="button" class="button button-outline" data-slide-previous>Previous</button><span class="slide-viewer__counter" aria-live="polite" aria-atomic="true"></span><button type="button" class="button button-dark" data-slide-next>Next</button></footer>';
  document.body.append(dialog);
  const image = dialog.querySelector('img');
  const previous = dialog.querySelector('[data-slide-previous]');
  const next = dialog.querySelector('[data-slide-next]');
  const close = dialog.querySelector('[data-slide-close]');
  const counter = dialog.querySelector('.slide-viewer__counter');
  let current = 0, opener, start;
  const show = index => {
    current = Math.max(0, Math.min(slides.length - 1, index));
    image.src = slides[current].src;
    image.alt = `Original presentation slide ${current + 1} of ${slides.length}`;
    image.width = slides[current].width;
    image.height = slides[current].height;
    counter.textContent = `${current + 1} / ${slides.length}`;
    previous.disabled = current === 0;
    next.disabled = current === slides.length - 1;
    if (document.activeElement === previous && previous.disabled) next.focus();
    if (document.activeElement === next && next.disabled) previous.focus();
  };
  document.querySelectorAll('[data-slide-open]').forEach(button => button.addEventListener('click', () => {
    opener = button;
    show(Number(button.dataset.slideOpen) - 1);
    dialog.showModal();
    close.focus();
  }));
  previous.addEventListener('click', () => show(current - 1));
  next.addEventListener('click', () => show(current + 1));
  close.addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => { start = null; opener?.focus(); });
  dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
  dialog.addEventListener('keydown', event => {
    if (event.key === 'Tab') {
      const controls = [...dialog.querySelectorAll('button:not(:disabled)')];
      const first = controls[0], last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      show(current + (event.key === 'ArrowRight' ? 1 : -1));
    }
  });
  image.addEventListener('pointerdown', event => { if (event.pointerType !== 'mouse') start = {x:event.clientX, y:event.clientY}; });
  image.addEventListener('pointerup', event => {
    if (!start) return;
    const dx = event.clientX - start.x, dy = event.clientY - start.y;
    start = null;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) show(current + (dx < 0 ? 1 : -1));
  });
  image.addEventListener('pointercancel', () => { start = null; });
})();
