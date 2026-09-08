const form = document.querySelector('#event-form');
const date = form.elements.date;
const now = new Date();
date.min = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
document.querySelectorAll('[data-event]').forEach(link => link.addEventListener('click', () => { form.elements.event.value = link.dataset.event; }));
let downloadUrl;
form.addEventListener('input', () => { document.querySelector('#enquiry-result').hidden = true; });
form.addEventListener('submit', event => {
  event.preventDefault();
  if (!form.reportValidity()) return;
  if (downloadUrl) URL.revokeObjectURL(downloadUrl);
  const data = new FormData(form);
  const text = ['DELUXE MANNA — EVENT ENQUIRY','Prepared locally. Not sent.','',...Array.from(data, ([key,value]) => `${key.charAt(0).toUpperCase()+key.slice(1)}: ${value}`)].join('\n');
  downloadUrl = URL.createObjectURL(new Blob([text], {type:'text/plain;charset=utf-8'}));
  document.querySelector('#download-enquiry').href = downloadUrl;
  document.querySelector('#enquiry-result').hidden = false;
  const subject = `Event enquiry — ${data.get('event')} — ${data.get('date')}`;
  window.location.href = `mailto:hello@deluxemanna.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(text)}`;
});
