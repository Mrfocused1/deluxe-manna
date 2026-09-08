(() => {
  const SB_URL = 'https://jzadjdtbidpomdvmhocb.supabase.co';
  const SB_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp6YWRqZHRiaWRwb21kdm1ob2NiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg4ODI4NjcsImV4cCI6MjEwNDQ1ODg2N30.ZFt5WiZyKabpUniqgRw2vTE_NWucGFPg-4xQpBw0ypU';
  const headers = { apikey: SB_ANON, Authorization: 'Bearer '+SB_ANON, 'Content-Type':'application/json' };
  const $ = (s, r=document) => r.querySelector(s);
  const $$ = (s, r=document) => [...r.querySelectorAll(s)];

  const loginView = $('#login-view');
  const appView = $('#app-view');
  const loginForm = $('#login-form');
  const loginInput = $('#login-pass');
  const loginErr = $('#login-err');
  const nav = $('#admin-nav');
  const main = $('#admin-main');
  const catTitle = $('#cat-title');
  let siteRows = [];
  let menuRows = [];
  let currentCat = 'Global';

  function isAuthed(){ return sessionStorage.getItem('dm-admin')==='1'; }
  function showApp(){ loginView.hidden=true; appView.hidden=false; loadAll(); }
  function showLogin(){ loginView.hidden=false; appView.hidden=true; }

  if(isAuthed()) showApp(); else showLogin();

  loginForm?.addEventListener('submit', async (e)=>{
    e.preventDefault();
    const pass = loginInput.value.trim();
    // fetch admin password from supabase
    try{
      const r = await fetch(`${SB_URL}/rest/v1/site_content?select=value_text&key=eq.admin.password`, {headers});
      const j = await r.json();
      const expected = j[0]?.value_text || 'Password';
      if(pass === expected){
        sessionStorage.setItem('dm-admin','1');
        showApp();
      } else loginErr.textContent='Incorrect password';
    }catch{
      if(pass==='Password'){ sessionStorage.setItem('dm-admin','1'); showApp(); } else loginErr.textContent='Incorrect password';
    }
  });
  $('#logout')?.addEventListener('click', ()=>{ sessionStorage.removeItem('dm-admin'); showLogin(); });

  async function loadAll(){
    await Promise.all([loadSite(), loadMenu(), loadOrders()]);
    renderNav(); renderCat();
  }

  async function loadSite(){
    const r = await fetch(`${SB_URL}/rest/v1/site_content?select=*&order=category.asc,key.asc`, {headers});
    siteRows = await r.json();
  }
  async function loadMenu(){
    const r = await fetch(`${SB_URL}/rest/v1/menu_items?select=*&order=sort_order.asc`, {headers});
    menuRows = await r.json();
  }
  async function loadOrders(){
    const r = await fetch(`${SB_URL}/rest/v1/orders?select=*&order=created_at.desc&limit=50`, {headers});
    window._orders = await r.json();
  }

  function categories(){
    const cats = [...new Set(siteRows.map(r=>r.category))];
    // ensure order
    const order = ['Global','Home — Hero','Home — Menu','Home — Booking','Home — Story','Menu','Catering & Events','Contact','Admin'];
    return cats.sort((a,b)=> order.indexOf(a)-order.indexOf(b));
  }

  function renderNav(){
    const cats = categories();
    nav.innerHTML = cats.map(c=> `<button data-cat="${c}" class="${c===currentCat?'active':''}">${c}</button>`).join('') +
      `<h3>Commerce</h3><button data-cat="Menu Items" class="${currentCat==='Menu Items'?'active':''}">Menu Items <small>(${menuRows.length})</small></button><button data-cat="Orders" class="${currentCat==='Orders'?'active':''}">Orders <small>(${window._orders?.length||0})</small></button>`;
    $$('#admin-nav button').forEach(b=> b.addEventListener('click', ()=>{ currentCat=b.dataset.cat; renderNav(); renderCat(); }));
  }

  function renderCat(){
    catTitle.innerHTML = currentCat.replace(' — ',' <em>—</em> ');
    if(currentCat==='Menu Items') return renderMenu();
    if(currentCat==='Orders') return renderOrders();
    const rows = siteRows.filter(r=> r.category===currentCat);
    main.innerHTML = rows.map(row=> cardForRow(row)).join('') || `<p class="note">No fields in this section.</p>`;
    // bind saves
    rows.forEach(row=> bindRow(row));
  }

  function cardForRow(row){
    const isMedia = row.content_type==='image' || row.content_type==='video';
    const val = row.media_url && isMedia ? row.media_url : row.value_text||'';
    const input = row.content_type==='textarea'
      ? `<textarea rows="3" data-key="${row.key}">${escapeHtml(row.value_text||'')}</textarea>`
      : row.content_type==='image' || row.content_type==='video'
        ? `<input type="text" placeholder="assets/..." data-key="${row.key}" value="${escapeAttr(val)}"><input type="file" accept="${row.content_type==='video'?'video/*':'image/*'}" data-file="${row.key}">`
        : `<input type="text" data-key="${row.key}" value="${escapeAttr(row.value_text||'')}">`;
    const preview = row.content_type==='image' ? `<img src="${escapeAttr(val||'assets/logo.png')}" data-preview="${row.key}" alt="">`
      : row.content_type==='video' ? `<video src="${escapeAttr(val)}" data-preview="${row.key}" muted loop playsinline></video>` : '';
    return `<div class="card" data-card="${row.key}">
      <h3>${row.label} <span class="badge">${row.content_type}</span> <small style="color:var(--muted); font-weight:400; margin-left:8px">${row.key}</small></h3>
      <div class="field">${input}</div>
      ${isMedia? `<div class="media-row">${preview}<span class="note">Upload to Supabase Storage (site-media) or paste URL. Save updates instantly.</span></div>`:''}
      <div class="save-row"><button class="btn btn-gold" data-save="${row.key}">Save</button><span class="status" data-status="${row.key}"></span><a class="btn" href="#" data-preview-link="${row.key}" style="margin-left:auto; text-decoration:none">Preview</a></div>
    </div>`;
  }

  function bindRow(row){
    const saveBtn = $(`[data-save="${row.key}"]`);
    const status = $(`[data-status="${row.key}"]`);
    const fileInput = $(`[data-file="${row.key}"]`);
    // file upload
    fileInput?.addEventListener('change', async (e)=>{
      const file = e.target.files[0]; if(!file) return;
      status.textContent='Uploading…';
      try{
        const ext = file.name.split('.').pop();
        const path = `cms/${row.key}-${Date.now()}.${ext}`;
        const up = await fetch(`${SB_URL}/storage/v1/object/site-media/${path}`, {
          method:'POST',
          headers:{ apikey: SB_ANON, Authorization:'Bearer '+SB_ANON, 'x-upsert':'true' },
          body: file
        });
        if(!up.ok) throw new Error(await up.text());
        const url = `${SB_URL}/storage/v1/object/public/site-media/${path}`;
        $(`[data-key="${row.key}"]`).value = url;
        const prev = $(`[data-preview="${row.key}"]`);
        if(prev) prev.src = url;
        // auto save
        await saveRow(row.key, url, true);
        status.textContent='Uploaded & saved';
      }catch(err){ status.textContent='Upload failed: '+err.message; }
    });
    saveBtn?.addEventListener('click', async ()=>{
      const inp = $(`[data-key="${row.key}"]`);
      const val = inp.value.trim();
      await saveRow(row.key, val, row.content_type==='image'||row.content_type==='video');
    });
  }

  async function saveRow(key, val, isMedia){
    const status = $(`[data-status="${key}"]`);
    status.textContent='Saving…';
    const row = siteRows.find(r=>r.key===key);
    const body = isMedia ? { media_url: val, value_text: val } : { value_text: val };
    // also if image, set media_url same
    const r = await fetch(`${SB_URL}/rest/v1/site_content?key=eq.${encodeURIComponent(key)}`, {
      method:'PATCH', headers:{...headers, Prefer:'return=representation'}, body: JSON.stringify({...body, updated_at: new Date().toISOString()})
    });
    if(r.ok){ status.textContent='Saved ✓'; setTimeout(()=> status.textContent='', 2000); row.value_text=val; row.media_url=val;
      // refresh frontend via supabase-content if open in another tab: polling will pick up
    } else { status.textContent='Error '+(await r.text()).slice(0,120); }
  }

  function renderMenu(){
    main.innerHTML = `<div style="display:flex; gap:10px; margin-bottom:14px"><button class="btn btn-gold" id="menu-add">+ Add dish</button><input id="menu-search" placeholder="Search menu…" style="flex:1; background:#0f1210; border:1px solid var(--line); border-radius:100px; padding:10px 14px; color:var(--cream)"></div><div id="menu-grid" class="orders"></div>`;
    const grid = $('#menu-grid');
    const search = $('#menu-search');
    function draw(filter=''){
      const f = filter.toLowerCase();
      const rows = menuRows.filter(r=> !f || (r.name+r.category+r.description||'').toLowerCase().includes(f));
      grid.innerHTML = rows.map(r=> `
        <div class="card">
          <div style="display:flex; gap:12px">
            <img src="${escapeAttr(r.image_url||'assets/logo.png')}" style="width:64px;height:64px;object-fit:cover;border-radius:10px;border:1px solid var(--line)">
            <div style="flex:1">
              <div class="field" style="margin:0"><label>Name</label><input data-mfield="name" data-id="${r.id}" value="${escapeAttr(r.name)}"></div>
              <div class="grid2"><div class="field"><label>Price (£)</label><input type="number" step="0.01" data-mfield="price" data-id="${r.id}" value="${(r.price_pence/100).toFixed(2)}"></div><div class="field"><label>Category</label><input data-mfield="category" data-id="${r.id}" value="${escapeAttr(r.category)}"></div></div>
              <div class="field"><label>Description</label><textarea rows="2" data-mfield="description" data-id="${r.id}">${escapeHtml(r.description||'')}</textarea></div>
              <div class="field"><label>Image</label><input data-mfield="image_url" data-id="${r.id}" value="${escapeAttr(r.image_url||'')}" placeholder="assets/menu/... or https://..."><input type="file" accept="image/*" data-mfile="${r.id}" style="margin-top:8px"></div>
              <div style="display:flex; gap:8px; flex-wrap:wrap">
                <label style="font-size:12px"><input type="checkbox" data-mfield="available" data-id="${r.id}" ${r.available?'checked':''}> Available</label>
                <button class="btn btn-gold" data-msave="${r.id}">Save</button>
                <button class="btn" data-mdel="${r.id}" style="color:#ff8a8a; border-color:#ff8a8a3a">Delete</button>
                <span class="status" data-mstatus="${r.id}"></span>
              </div>
            </div>
          </div>
        </div>
      `).join('');
      grid.querySelectorAll('[data-msave]').forEach(b=> b.addEventListener('click', ()=> saveMenu(b.dataset.msave)));
      grid.querySelectorAll('[data-mdel]').forEach(b=> b.addEventListener('click', ()=> delMenu(b.dataset.mdel)));
      grid.querySelectorAll('[data-mfile]').forEach(inp=> inp.addEventListener('change', async (e)=>{
        const file=e.target.files[0]; if(!file) return;
        const id=e.target.dataset.mfile;
        const status=$(`[data-mstatus="${id}"]`);
        status.textContent='Uploading…';
        try{
          const ext=file.name.split('.').pop();
          const path=`menu/${id}-${Date.now()}.${ext}`;
          const up=await fetch(`${SB_URL}/storage/v1/object/site-media/${path}`, {method:'POST', headers:{apikey:SB_ANON, Authorization:'Bearer '+SB_ANON, 'x-upsert':'true'}, body:file});
          if(!up.ok) throw new Error(await up.text());
          const url=`${SB_URL}/storage/v1/object/public/site-media/${path}`;
          $(`[data-mfield="image_url"][data-id="${id}"]`).value=url;
          const img=e.target.closest('.card')?.querySelector('img'); if(img) img.src=url;
          status.textContent='Uploaded — click Save';
        }catch(err){ status.textContent='Upload failed: '+err.message; }
      }));
    }
    search.addEventListener('input', ()=> draw(search.value));
    $('#menu-add').addEventListener('click', async ()=>{
      const id = Date.now().toString();
      const newRow = {id, category:'Starters', name:'New dish', description:'', price_pence:899, image_url:'', available:true, sort_order: menuRows.length};
      const r = await fetch(`${SB_URL}/rest/v1/menu_items`, {method:'POST', headers:{...headers, Prefer:'return=representation'}, body: JSON.stringify(newRow)});
      if(r.ok){ const j=await r.json(); menuRows.push(j[0]); renderNav(); draw(search.value); try{localStorage.setItem('dm-menu-bump',Date.now().toString());}catch{} }
    });
    draw();
  }

  async function saveMenu(id){
    const status = $(`[data-mstatus="${id}"]`);
    status.textContent='Saving…';
    const name = $(`[data-mfield="name"][data-id="${id}"]`).value.trim();
    const price = Math.round(parseFloat($(`[data-mfield="price"][data-id="${id}"]`).value)*100)||0;
    const category = $(`[data-mfield="category"][data-id="${id}"]`).value.trim();
    const description = $(`[data-mfield="description"][data-id="${id}"]`).value.trim();
    const image_url = $(`[data-mfield="image_url"][data-id="${id}"]`).value.trim();
    const available = $(`[data-mfield="available"][data-id="${id}"]`).checked;
    const r = await fetch(`${SB_URL}/rest/v1/menu_items?id=eq.${encodeURIComponent(id)}`, {method:'PATCH', headers:{...headers, Prefer:'return=representation'}, body: JSON.stringify({name, price_pence:price, category, description, image_url: image_url||null, available, updated_at: new Date().toISOString()})});
    if(r.ok){ status.textContent='Saved ✓'; setTimeout(()=>status.textContent='',2000); const row=menuRows.find(x=>x.id===id); Object.assign(row,{name, price_pence:price, category, description, image_url, available}); try{localStorage.setItem('dm-menu-bump',Date.now().toString());}catch{} }
    else status.textContent='Error '+(await r.text()).slice(0,120);
  }
  async function delMenu(id){
    if(!confirm('Delete this dish?')) return;
    const r = await fetch(`${SB_URL}/rest/v1/menu_items?id=eq.${encodeURIComponent(id)}`, {method:'DELETE', headers});
    if(r.ok){ menuRows=menuRows.filter(x=>x.id!==id); renderNav(); document.querySelector(`[data-msave="${id}"]`)?.closest('.card')?.remove(); try{localStorage.setItem('dm-menu-bump',Date.now().toString());}catch{} }
  }

  function renderOrders(){
    const orders = window._orders||[];
    if(!orders.length){ main.innerHTML=`<div class="card"><p class="note">No orders yet. Cart orders appear here instantly.</p></div>`; return; }
    main.innerHTML = orders.map(o=> `
      <div class="order">
        <div style="display:flex; justify-content:space-between; gap:12px; flex-wrap:wrap">
          <h4>${o.order_number||o.id.slice(0,8)} — ${o.customer_name}</h4>
          <span class="badge">${o.status}</span>
        </div>
        <small>${new Date(o.created_at).toLocaleString('en-GB')} · ${o.customer_email} · ${o.customer_phone||''}</small>
        <p style="margin:8px 0 6px; font-size:13px; color:var(--muted)">${escapeHtml(o.delivery_address||'')}${o.delivery_postcode?' — '+o.delivery_postcode:''}</p>
        <div style="font-size:13px; margin:8px 0">${(o.items||[]).map(it=> `${it.name} ×${it.qty} — £${((it.price*it.qty)/100).toFixed(2)}`).join('<br>')}</div>
        <div style="display:flex; gap:8px; align-items:center; margin-top:8px">
          <strong>£${(o.total_pence/100).toFixed(2)}</strong>
          <select data-ostatus="${o.id}" style="margin-left:auto; background:#0f1210; border:1px solid var(--line); border-radius:10px; padding:6px 10px; color:var(--cream)">
            ${['pending','confirmed','preparing','out_for_delivery','delivered','cancelled'].map(s=> `<option value="${s}" ${o.status===s?'selected':''}>${s}</option>`).join('')}
          </select>
          <button class="btn" data-osave="${o.id}">Update</button>
          <span class="status" data-ostatus-msg="${o.id}"></span>
        </div>
      </div>
    `).join('');
    main.querySelectorAll('[data-osave]').forEach(b=> b.addEventListener('click', async ()=>{
      const id=b.dataset.osave; const sel = $(`[data-ostatus="${id}"]`); const status=sel.value;
      const msg=$(`[data-ostatus-msg="${id}"]`); msg.textContent='Saving…';
      const r=await fetch(`${SB_URL}/rest/v1/orders?id=eq.${id}`, {method:'PATCH', headers:{...headers, Prefer:'return=representation'}, body: JSON.stringify({status})});
      if(r.ok) msg.textContent='Saved ✓'; else msg.textContent='Error';
    }));
  }

  function escapeHtml(s){ return (s||'').replace(/[&<>"']/g, c=> ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;"}[c])); }
  function escapeAttr(s){ return escapeHtml(s); }
})();
