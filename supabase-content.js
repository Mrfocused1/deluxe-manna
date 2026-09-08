(() => {
  const SUPABASE_URL = 'https://jzadjdtbidpomdvmhocb.supabase.co';
  const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp6YWRqZHRiaWRwb21kdm1ob2NiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg4ODI4NjcsImV4cCI6MjEwNDQ1ODg2N30.ZFt5WiZyKabpUniqgRw2vTE_NWucGFPg-4xQpBw0ypU';
  const MAP = {
    'global.brand_name': { sel: '.brand-name', attr: 'text', fn: (el,v)=>{ const sm=el.querySelector('small'); el.childNodes[0].textContent=v; if(sm) el.appendChild(sm); } },
    'global.brand_sub': { sel: '.brand-name small', attr: 'text' },
    'global.contact_email': { sel: 'a[href^="mailto:"]', attr: 'href', fn:(el,v)=>{el.href='mailto:'+v; el.textContent=v; }},
    'global.footer_tagline': { sel: '.footer-brand p', attr: 'text' },
    'global.footer_culture': { sel: '.footer-culture', attr: 'text' },
    'home.hero.eyebrow': { sel: '.home-hero .home-hero-copy .eyebrow', attr:'text' },
    'home.hero.intro': { sel: '.home-hero-intro', attr:'html', fn:(el,v)=> el.innerHTML=v.replace(/\n/g,'<br>') },
    'home.hero.button_text': { sel: '.home-menu-button', attr:'text' },
    'home.hero.button_link': { sel: '.home-menu-button', attr:'href' },
    'home.hero.image': { sel: '.home-hero-image img', attr:'src' },
    'home.hero.photo_note_title': { sel: '.hero-photo-note span', attr:'text' },
    'home.hero.photo_note_text': { sel: '.hero-photo-note', attr:'html', fn:(el,v)=>{ const s=el.querySelector('span'); el.innerHTML=`<span>${s? s.textContent:'FROM OUR KITCHEN'}</span>`+v.replace(/\n/g,'<br>')} },
    'home.hero.bottom_text': { sel: '.home-hero-bottom span', attr:'text' },
    'home.menu.eyebrow': { sel: '.home-menu .home-section-top .eyebrow', attr:'text' },
    'home.menu.title': { sel: '#menu-title', attr:'text' },
    'home.menu.caption': { sel: '.home-menu-caption p', attr:'text' },
    'home.menu.link_text': { sel: '.home-menu-caption .text-link', attr:'text' },
    'home.menu.link_url': { sel: '.home-menu-caption .text-link', attr:'href' },
    'home.booking.eyebrow': { sel: '.booking-copy .eyebrow', attr:'text' },
    'home.booking.title': { sel: '#booking-title', attr:'html' },
    'home.booking.intro': { sel: '.booking-copy > p:not(.eyebrow)', attr:'text' },
    'home.booking.image': { sel: '.booking-photo img', attr:'src' },
    'home.booking.form_note': { sel: '#reservation-start .form-note', attr:'text' },
    'home.story.eyebrow': { sel: '.story-copy .eyebrow', attr:'text' },
    'home.story.title': { sel: '#story-title', attr:'html' },
    'home.story.p1': { sel: '.story-copy p:nth-of-type(2)', attr:'text' },
    'home.story.p2': { sel: '.story-copy p:nth-of-type(3)', attr:'text' },
    'home.story.link_text': { sel: '.story-copy .text-link', attr:'text' },
    'home.story.link_url': { sel: '.story-copy .text-link', attr:'href' },
    'home.story.image_culture': { sel: '.story-culture img', attr:'src' },
    'home.story.image_kitchen': { sel: '.story-kitchen img', attr:'src' },
    'menu.hero.eyebrow': { sel: '.mv2-hero-copy .eyebrow', attr:'text' },
    'menu.hero.title': { sel: '#menu-page-title', attr:'html' },
    'menu.hero.description': { sel: '.mv2-hero-description', attr:'html', fn:(el,v)=> el.innerHTML=v.replace(/\n/g,'<br>') },
    'menu.hero.video_poster': { sel: '.mv2-hero-video', attr:'poster' },
    'menu.hero.video': { sel: '.mv2-hero-video source', attr:'src', fn:(el,v)=>{el.src=v; el.closest('video')?.load();} },
    'menu.hero.video_link': { sel: '.mv2-reel-link', attr:'href' },
    'catering.hero.eyebrow': { sel: '.ev-hero-copy .eyebrow', attr:'text' },
    'catering.hero.title': { sel: '#events-title', attr:'html' },
    'catering.hero.intro': { sel: '.ev-hero-intro', attr:'html', fn:(el,v)=> el.innerHTML=v.replace(/\n/g,'<br>') },
    'catering.hero.image': { sel: '.ev-hero-visual img', attr:'src' },
    'contact.hero.eyebrow': { sel: '.ct-hero-copy .eyebrow', attr:'text' },
    'contact.hero.title': { sel: '#contact-title', attr:'html' },
    'contact.hero.lead': { sel: '.ct-lead', attr:'html', fn:(el,v)=> el.innerHTML=v.replace(/\n/g,'<br>') },
    'contact.hero.image': { sel: '.ct-hero-photo img', attr:'src' },
  };

  async function apply(){
    try{
      const r = await fetch(`${SUPABASE_URL}/rest/v1/site_content?select=key,value_text,media_url,content_type`, {
        headers: { apikey: SUPABASE_ANON, Authorization: 'Bearer '+SUPABASE_ANON }
      });
      if(!r.ok) return;
      const rows = await r.json();
      rows.forEach(row=>{
        const cfg = MAP[row.key];
        if(!cfg) return;
        const val = row.media_url && row.content_type==='image' || row.content_type==='video' ? row.media_url : row.value_text;
        if(!val) return;
        document.querySelectorAll(cfg.sel).forEach(el=>{
          try{
            if(cfg.fn) cfg.fn(el, val);
            else if(cfg.attr==='text') el.textContent = val;
            else if(cfg.attr==='html') el.innerHTML = val;
            else if(cfg.attr==='src' || cfg.attr==='poster' || cfg.attr==='href') el.setAttribute(cfg.attr, val);
          }catch{}
        });
      });
    }catch(e){ console.warn('supabase-content', e); }
  }

  // initial + realtime
  apply();
  // realtime via polling every 10s + on visibility
  let timer = setInterval(apply, 10000);
  document.addEventListener('visibilitychange', ()=>{ if(!document.hidden) apply(); });
  // also subscribe via supabase realtime if available (optional)
  try{
    const chan = new EventSource(`${SUPABASE_URL}/rest/v1/site_content?select=*`);
    chan.onerror = ()=> {};
  }catch{}

  window.DM_SUPABASE_CONTENT = { refresh: apply };
})();
