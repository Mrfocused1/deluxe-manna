(() => {
  const SB_URL = 'https://jzadjdtbidpomdvmhocb.supabase.co';
  const SB_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp6YWRqZHRiaWRwb21kdm1ob2NiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg4ODI4NjcsImV4cCI6MjEwNDQ1ODg2N30.ZFt5WiZyKabpUniqgRw2vTE_NWucGFPg-4xQpBw0ypU';
  const MAP = new Map();

  async function fetchMenu(){
    try{
      const r = await fetch(`${SB_URL}/rest/v1/menu_items?select=*&order=sort_order.asc`, { headers:{ apikey: SB_ANON, Authorization:'Bearer '+SB_ANON }});
      if(!r.ok) return null;
      const rows = await r.json();
      rows.forEach(it=> MAP.set(it.id, it));
      return rows;
    }catch{ return null; }
  }

  function patchMenu(rows){
    if(!rows) return;
    // Update catalogue JSON for cart
    const catEl = document.getElementById('menu-catalogue-data');
    if(catEl){
      try{
        const cat = JSON.parse(catEl.textContent);
        cat.items = rows.map(r=> ({ id:r.id, name:r.name, description:r.description, price:r.price_pence, image:r.image_url, category:r.category, available:r.available, popular:(r.tags||[]).includes('popular') }));
        catEl.textContent = JSON.stringify(cat);
      }catch{}
    }
    // Patch each dish card
    rows.forEach(it=>{
      const card = document.getElementById(`dish-${it.id}`);
      if(!card){
        // If new dish, we need to create it — for now skip, will appear after refresh when build regenerates or we inject
        // Try to inject into correct category grid
        const slug = 'menu-'+ it.category.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
        const grid = document.querySelector(`#${slug} .mv2-dish-grid`);
        if(grid){
          const price = `£${(it.price_pence/100).toFixed(2)}`;
          const img = it.image_url ? `<div class="mv2-dish-photo"><img src="${it.image_url}" alt="${it.name}" loading="lazy" width="800" height="600"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 19 19 5M5 5h14v14"/></svg></div>` : '';
          const tag = (it.tags||[]).includes('popular') ? '<span class="mv2-dish-tag">A favourite</span>' : '';
          const una = !it.available ? '<span class="mv2-dish-unavailable">Currently unavailable</span>' : '';
          const art = document.createElement('article');
          art.className = `mv2-dish ${!it.image_url?'mv2-dish-no-photo':''}`;
          art.id = `dish-${it.id}`;
          art.dataset.menuId = it.id;
          art.dataset.search = `${it.name} ${it.description||''} ${it.category}`.toLowerCase();
          art.innerHTML = `<div class="mv2-dish-copy"><div class="mv2-dish-meta">${tag}${una}</div><h3>${it.name}</h3><p class="mv2-dish-description">${it.description||'Freshly prepared to order.'}</p><span class="mv2-dish-price">${price}</span></div>${img}<button class="mv2-add" type="button" data-add="${it.id}" aria-label="Add ${it.name} to basket"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg></button><button class="mv2-dish-open" type="button" data-dish="${it.id}" aria-haspopup="dialog" aria-label="View ${it.name} details"><span class="mv2-visually-hidden">View dish details</span></button>`;
          grid.appendChild(art);
        }
        return;
      }
      // Update existing card
      const h3 = card.querySelector('h3'); if(h3) h3.textContent = it.name;
      const desc = card.querySelector('.mv2-dish-description'); if(desc) desc.textContent = it.description || 'Freshly prepared to order.';
      const priceEl = card.querySelector('.mv2-dish-price'); if(priceEl) priceEl.textContent = `£${(it.price_pence/100).toFixed(2)}`;
      const imgEl = card.querySelector('.mv2-dish-photo img');
      if(it.image_url){
        if(imgEl){ imgEl.src = it.image_url; imgEl.alt = it.name; imgEl.closest('.mv2-dish-photo').hidden = false; }
        else {
          // add photo if missing
          const copy = card.querySelector('.mv2-dish-copy');
          const div = document.createElement('div'); div.className='mv2-dish-photo'; div.innerHTML=`<img src="${it.image_url}" alt="${it.name}" loading="lazy" width="800" height="600"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 19 19 5M5 5h14v14"/></svg>`;
          copy.after(div);
          card.classList.remove('mv2-dish-no-photo');
        }
      } else {
        if(imgEl) imgEl.closest('.mv2-dish-photo')?.remove();
        card.classList.add('mv2-dish-no-photo');
      }
      // Availability
      const meta = card.querySelector('.mv2-dish-meta');
      if(meta){
        meta.innerHTML = (it.tags||[]).includes('popular') ? '<span class="mv2-dish-tag">A favourite</span>' : '';
        if(!it.available) meta.innerHTML += '<span class="mv2-dish-unavailable">Currently unavailable</span>';
      }
      // Hide unavailable? Keep visible but dimmed via CSS
      if(!it.available) card.style.opacity = '.55'; else card.style.opacity = '';
      // Update search data
      card.dataset.search = `${it.name} ${it.description||''} ${it.category}`.toLowerCase();
      // Remove if deleted? Handled below
    });
    // Remove cards that no longer exist in DB (deleted)
    document.querySelectorAll('.mv2-dish[id^="dish-"]').forEach(card=>{
      const id = card.id.replace('dish-','');
      if(!MAP.has(id)) card.remove();
    });
    // Also patch home meal carousel (index.html) - 6 slides
    document.querySelectorAll('.meal-slide').forEach(slide=>{
      const link = slide.querySelector('a[href*="dish-"]');
      if(!link) return;
      const m = link.href.match(/dish-(\d+)/);
      if(!m) return;
      const it = MAP.get(m[1]);
      if(!it) return;
      const title = slide.querySelector('h3 a'); if(title) title.textContent = it.name;
      const price = slide.querySelector('.meal-title span'); if(price) price.textContent = `£${(it.price_pence/100).toFixed(2)}`;
      const p = slide.querySelector('p'); if(p) p.textContent = it.description||p.textContent;
      const img = slide.querySelector('img'); if(img && it.image_url) img.src = it.image_url;
    });
    // Update counts
    const countEl = document.getElementById('menu-result-count');
    if(countEl) countEl.textContent = `${rows.length} dishes & drinks`;
  }

  async function sync(){
    const rows = await fetchMenu();
    if(rows) patchMenu(rows);
  }

  // initial + polling + realtime
  sync();
  setInterval(sync, 8000);
  document.addEventListener('visibilitychange', ()=>{ if(!document.hidden) sync(); });
  // also listen to storage events (admin tab saved)
  window.addEventListener('storage', (e)=>{ if(e.key==='dm-menu-bump') sync(); });
  window.DM_SUPABASE_MENU = { sync, fetchMenu };
})();
