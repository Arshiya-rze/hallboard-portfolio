(() => {
  const dialog = document.querySelector('#contact-dialog');
  if (!dialog || typeof dialog.showModal !== 'function') return;
  let opener;
  document.querySelectorAll('[data-contact-open]').forEach(link => {
    link.setAttribute('aria-haspopup', 'dialog');
    link.setAttribute('aria-controls', dialog.id);
    link.setAttribute('role', 'button');
    link.addEventListener('keydown', event => {
      if (event.key === ' ') { event.preventDefault(); link.click(); }
    });
    link.addEventListener('click', event => {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      opener = link;
      if (!dialog.open) dialog.showModal();
      document.documentElement.classList.add('contact-modal-open');
    });
  });
  dialog.querySelector('[data-contact-close]').addEventListener('click', () => dialog.close());
  let outside = false;
  const isOutside = event => {
    const r = dialog.getBoundingClientRect();
    return event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom;
  };
  dialog.addEventListener('pointerdown', event => { outside = isOutside(event); });
  dialog.addEventListener('click', event => { if (outside && isOutside(event)) dialog.close(); });
  dialog.addEventListener('close', () => {
    document.documentElement.classList.remove('contact-modal-open');
    opener?.focus({ preventScroll: true });
  });
})();
