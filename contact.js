const contactForm = document.querySelector('#contact-form');
contactForm.addEventListener('submit', event => {
  event.preventDefault();
  if (!contactForm.reportValidity()) return;
  const data = new FormData(contactForm);
  const body = `Name: ${data.get('name')}\nEmail: ${data.get('email')}\n\n${data.get('message')}`;
  document.querySelector('.contact-result').hidden = false;
  window.location.href = `mailto:hello@deluxemanna.com?subject=${encodeURIComponent(data.get('subject'))}&body=${encodeURIComponent(body)}`;
});
contactForm.addEventListener('input', () => { document.querySelector('.contact-result').hidden = true; });
