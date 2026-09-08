(() => {
  const list = document.getElementById('checkout-items');
  const empty = document.getElementById('checkout-empty');
  const totals = document.getElementById('checkout-totals');
  if(!list) return;
  function render(){
    const cart = (()=>{ try{return JSON.parse(localStorage.getItem('dm-cart-v1')||'[]')}catch{return []}})();
    if(!cart.length){
      list.innerHTML=''; empty.hidden=false; totals.hidden=true; return;
    }
    empty.hidden=true; totals.hidden=false;
    list.innerHTML = cart.map(it=>`
      <div class="cart-item">
        <img src="${it.image||'assets/logo.png'}" alt="">
        <div><h4>${it.name}</h4><p>£${(it.price/100).toFixed(2)} <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg> ${it.qty}</p></div>
        <div class="cart-item-price">£${((it.price*it.qty)/100).toFixed(2)}</div>
      </div>
    `).join('');
    // keep totals in sync with cart.js (duplicate logic but ensures display)
    const sub = cart.reduce((s,i)=>s+i.price*i.qty,0);
    const fee = 250;
    const tot = sub+fee;
    document.querySelectorAll('[data-cart-subtotal]').forEach(el=> el.textContent=`£${(sub/100).toFixed(2)}`);
    document.querySelectorAll('[data-cart-fee]').forEach(el=> el.textContent=`£${(fee/100).toFixed(2)}`);
    document.querySelectorAll('[data-cart-total]').forEach(el=> el.textContent=`£${(tot/100).toFixed(2)}`);
  }
  render();
  window.addEventListener('storage', render);
  // also re-render when cart changes via polling
  setInterval(render, 800);
})();
