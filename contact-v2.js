(() => {
  const form = document.querySelector('#contact-form');
  if (!form) return;
  const message = form.elements.message;
  const result = form.querySelector('.ct-form-result');
  const counter = form.querySelector('.ct-character-count');
  const copyButton = form.querySelector('.ct-copy-message');
  const copyStatus = form.querySelector('.ct-copy-status');
  const copyFallback = form.querySelector('.ct-copy-fallback');
  let draft = '';

  form.addEventListener('input', () => {
    counter.textContent = `${message.value.length} / 3000`;
    result.hidden = true;
    copyStatus.textContent = '';
    copyFallback.hidden = true;
  });

  form.addEventListener('submit', event => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const data = new FormData(form);
    const subject = `Deluxe Manna — ${data.get('subject')}`;
    const body = `Name: ${String(data.get('name')).trim()}\nEmail: ${String(data.get('email')).trim()}\n\n${String(data.get('message')).trim()}`;
    draft = `To: hello@deluxemanna.com\nSubject: ${subject}\n\n${body}`;
    result.hidden = false;
    window.location.href = `mailto:hello@deluxemanna.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  });

  copyButton.addEventListener('click', async () => {
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(draft);
      copyStatus.textContent = 'Message copied. Paste it into your email app.';
    } catch {
      copyFallback.value = draft;
      copyFallback.hidden = false;
      copyFallback.focus();
      copyFallback.select();
      copyStatus.textContent = 'Select and copy the draft below.';
    }
  });
})();
