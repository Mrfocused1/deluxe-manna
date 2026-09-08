(() => {
  'use strict';
  const STORAGE_KEY = 'dm-cart-v1';
  const DELIVERY_FEE = 250; // £2.50
  const currency = p => `£${(p/100).toFixed(2)}`;

  let cart = [];
  try { cart = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch { cart = []; }

  const els = {};
  function save(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(cart)); updateBadge(); render(); }
  function totalPence(){ return cart.reduce((s,i)=> s + i.price*i.qty,0); }
  function count(){ return cart.reduce((s,i)=> s+i.qty,0); }

  function updateBadge(){
    const c = count();
    document.querySelectorAll('.cart-count, .mv2-basket-count').forEach(el=>{
      el.textContent = c? String(c): '';
      el.classList.toggle('has-items', c>0);
      if(el.classList.contains('mv2-basket-count')) el.hidden = !c;
    });
  }

  function render(){
    const list = document.querySelector('.cart-items');
    const empty = document.querySelector('.cart-empty');
    const subEl = document.querySelector('[data-cart-subtotal]');
    const feeEl = document.querySelector('[data-cart-fee]');
    const totEl = document.querySelector('[data-cart-total]');
    if(!list) return;
    const sub = totalPence();
    const fee = cart.length? DELIVERY_FEE:0;
    const tot = sub+fee;
    if(subEl) subEl.textContent = currency(sub);
    if(feeEl) feeEl.textContent = cart.length? currency(fee): '—';
    if(totEl) totEl.textContent = currency(tot);
    if(cart.length===0){
      list.innerHTML=''; if(empty) empty.hidden=false; return;
    }
    if(empty) empty.hidden=true;
    list.innerHTML = cart.map(it=>`
      <div class="cart-item" data-id="${it.id}">
        <img src="${it.image||'assets/logo.png'}" alt="">
        <div>
          <h4>${it.name}</h4>
          <p>${currency(it.price)} <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg> ${it.qty}</p>
          <div class="cart-qty">
            <button type="button" data-qty="-1" aria-label="Decrease"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14"/></svg></button>
            <span>${it.qty}</span>
            <button type="button" data-qty="1" aria-label="Increase">+</button>
          </div>
        </div>
        <div style="text-align:right">
          <div class="cart-item-price">${currency(it.price*it.qty)}</div>
          <button class="cart-remove" type="button" data-remove aria-label="Remove"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg></button>
        </div>
      </div>
    `).join('');
    list.querySelectorAll('[data-qty]').forEach(b=> b.addEventListener('click', ()=>{
      const id = b.closest('.cart-item').dataset.id;
      const d = parseInt(b.dataset.qty,10);
      const it = cart.find(x=>x.id===id);
      if(!it) return;
      it.qty += d;
      if(it.qty<=0) cart = cart.filter(x=>x.id!==id);
      save();
    }));
    list.querySelectorAll('[data-remove]').forEach(b=> b.addEventListener('click', ()=>{
      const id = b.closest('.cart-item').dataset.id;
      cart = cart.filter(x=>x.id!==id); save();
    }));
  }

  function flyToCart(startEl, imageSrc){
    const cartBtn = document.querySelector('.cart-trigger');
    if(!cartBtn || !startEl) return;
    const s = startEl.getBoundingClientRect();
    const e = cartBtn.getBoundingClientRect();
    const fly = document.createElement('img');
    fly.src = imageSrc || 'assets/logo.png';
    fly.className = 'cart-fly';
    fly.style.left = s.left + 'px';
    fly.style.top = s.top + 'px';
    fly.style.width = s.width + 'px';
    fly.style.height = s.height + 'px';
    document.body.appendChild(fly);
    // force reflow
    fly.getBoundingClientRect();
    const dx = e.left + e.width/2 - (s.left + s.width/2);
    const dy = e.top + e.height/2 - (s.top + s.height/2);
    fly.style.transform = `translate(${dx}px, ${dy}px) scale(.18)`;
    fly.classList.add('flying');
    cartBtn.classList.remove('pulse'); void cartBtn.offsetWidth; cartBtn.classList.add('pulse');
    setTimeout(()=> fly.remove(), 900);
    // wiggle card
    const card = startEl.closest('.mv2-dish');
    if(card){ card.classList.remove('wiggle'); void card.offsetWidth; card.classList.add('wiggle'); setTimeout(()=> card.classList.remove('wiggle'), 500); }
  }

  function addItem(id, qty=1, triggerEl, imageSrc){
    const catalogueEl = document.getElementById('menu-catalogue-data');
    let item = null;
    if(catalogueEl){
      try{ const cat = JSON.parse(catalogueEl.textContent); item = cat.items.find(x=> x.id===id); }catch{}
    }
    if(!item) return;
    const existing = cart.find(x=> x.id===id);
    if(existing) existing.qty += qty; else cart.push({id:item.id, name:item.name, price:item.price, image:item.image||imageSrc||'', qty});
    save();
    if(triggerEl) flyToCart(triggerEl, item.image||imageSrc);
    // toast
    const drawer = document.querySelector('.cart-drawer');
    if(drawer && !drawer.classList.contains('open')){
      // subtle pulse already, no auto open to avoid intrusive
    }
  }

  // Global handlers
  document.addEventListener('click', e=>{
    const add = e.target.closest('[data-add]');
    if(add){
      e.preventDefault(); e.stopPropagation();
      const id = add.dataset.add;
      const card = add.closest('.mv2-dish');
      const img = card?.querySelector('img')?.src;
      addItem(id, 1, card?.querySelector('.mv2-dish-photo')||add, img);
      // haptic
      if(navigator.vibrate) navigator.vibrate(10);
    }
    if(e.target.closest('[data-open-cart]') || e.target.closest('.cart-trigger')){
      openDrawer();
    }
    if(e.target.closest('[data-close-cart]') || e.target.closest('.cart-backdrop')){
      closeDrawer();
    }
  });

  // dialog add
  let dialogQty = 1;
  const dialog = document.getElementById('dish-dialog');
  const qtyEl = document.getElementById('dish-dialog-qty');
  const addBtn = document.getElementById('dish-dialog-add');
  function syncQty(){ if(qtyEl) qtyEl.textContent = String(dialogQty); }
  document.addEventListener('click', e=>{
    const b = e.target.closest('[data-qty]');
    if(!b || !b.closest('#dish-dialog')) return;
    const d = parseInt(b.dataset.qty,10);
    dialogQty = Math.max(1, dialogQty + d);
    syncQty();
  });
  // when dialog opens, reset qty
  if(dialog){
    const obs = new MutationObserver(()=>{ if(dialog.open){ dialogQty=1; syncQty(); }});
    obs.observe(dialog, {attributes:true, attributeFilter:['open']});
    dialog.addEventListener('close', ()=>{ dialogQty=1; syncQty(); });
  }
  if(addBtn){
    addBtn.addEventListener('click', ()=>{
      const title = document.getElementById('dish-dialog-title')?.textContent;
      // find id by title lookup in catalogue
      const catEl = document.getElementById('menu-catalogue-data');
      let id=null, img=null;
      if(catEl){
        try{
          const cat = JSON.parse(catEl.textContent);
          const it = cat.items.find(x=> x.name===title);
          if(it){ id=it.id; img=it.image; }
        }catch{}
      }
      if(!id && addBtn.dataset.id) id = addBtn.dataset.id;
      if(id){
        addItem(id, dialogQty, document.getElementById('dish-dialog-image'), img);
        dialog?.close();
      }
    });
  }

  function openDrawer(){ document.querySelector('.cart-drawer')?.classList.add('open'); document.querySelector('.cart-backdrop')?.classList.add('open'); document.body.style.overflow='hidden'; }
  function closeDrawer(){ document.querySelector('.cart-drawer')?.classList.remove('open'); document.querySelector('.cart-backdrop')?.classList.remove('open'); document.body.style.overflow=''; }

  // expose for menu-v2 dialog
  window.DM_CART = { addItem, openDrawer, closeDrawer, getCart:()=>cart, save };

  // patch dialog to set addBtn dataset
  document.addEventListener('click', e=>{
    const b = e.target.closest('[data-dish]');
    if(!b) return;
    setTimeout(()=>{
      const itemId = b.dataset.dish;
      if(addBtn) addBtn.dataset.id = itemId;
    },0);
  }, true);

  // checkout submit
  const checkoutForm = document.getElementById('checkout-form');
  if(checkoutForm){
    checkoutForm.addEventListener('submit', async (e)=>{
      e.preventDefault();
      if(!cart.length){ alert('Your basket is empty.'); return; }
      const fd = new FormData(checkoutForm);
      const payload = {
        customer_name: fd.get('name'),
        customer_email: fd.get('email'),
        customer_phone: fd.get('phone')||null,
        delivery_address: fd.get('address'),
        delivery_postcode: fd.get('postcode')||null,
        delivery_notes: fd.get('notes')||null,
        items: cart,
        subtotal_pence: totalPence(),
        delivery_fee_pence: DELIVERY_FEE,
        total_pence: totalPence()+DELIVERY_FEE
      };
      const btn = checkoutForm.querySelector('[type="submit"]');
      const orig = btn.textContent;
      btn.disabled=true; btn.textContent='Placing order…';
      try{
        const res = await fetch('https://jzadjdtbidpomdvmhocb.supabase.co/rest/v1/orders', {
          method:'POST',
          headers:{
            'apikey':'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp6YWRqZHRiaWRwb21kdm1ob2NiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg4ODI4NjcsImV4cCI6MjEwNDQ1ODg2N30.ZFt5WiZyKabpUniqgRw2vTE_NWucGFPg-4xQpBw0ypU',
            'Authorization':'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp6YWRqZHRiaWRwb21kdm1ob2NiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg4ODI4NjcsImV4cCI6MjEwNDQ1ODg2N30.ZFt5WiZyKabpUniqgRw2vTE_NWucGFPg-4xQpBw0ypU',
            'Content-Type':'application/json',
            'Prefer':'return=representation'
          },
          body: JSON.stringify(payload)
        });
        if(!res.ok) throw new Error(await res.text());
        const data = await res.json();
        const order = data[0];
        cart = []; save();
        // show success
        const success = document.getElementById('checkout-success');
        if(success){
          success.hidden=false;
          success.querySelector('[data-order-number]') && (success.querySelector('[data-order-number]').textContent = order.order_number||order.id.slice(0,8));
          checkoutForm.hidden=true;
          success.scrollIntoView({behavior:'smooth'});
        } else {
          alert('Order placed! '+(order.order_number||''));
          location.href='index.html';
        }
      }catch(err){
        alert('Could not place order: '+err.message);
      }finally{ btn.disabled=false; btn.textContent=orig; }
    });
  }

  // init
  updateBadge(); render();
  // esc to close
  document.addEventListener('keydown', e=>{ if(e.key==='Escape') closeDrawer(); });
})();
