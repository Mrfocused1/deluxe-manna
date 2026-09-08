(() => {
  const MENU_URL = 'https://jzadjdtbidpomdvmhocb.supabase.co/rest/v1/menu_items?select=id,name,price_pence,category';
  const SB_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp6YWRqZHRiaWRwb21kdm1ob2NiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg4ODI4NjcsImV4cCI6MjEwNDQ1ODg2N30.ZFt5WiZyKabpUniqgRw2vTE_NWucGFPg-4xQpBw0ypU';
  let menu = [];
  let cartObserver = null;

  async function loadMenu(){
    try{
      const r = await fetch(MENU_URL, { headers:{ apikey: SB_ANON, Authorization:'Bearer '+SB_ANON }});
      menu = await r.json();
    }catch{ menu = []; }
  }
  loadMenu();

  // UI refs
  const btn = document.querySelector('.voice-phone');
  const panel = document.querySelector('.voice-panel');
  const transcriptEl = document.querySelector('[data-voice-transcript]');
  const replyEl = document.querySelector('[data-voice-reply]');
  const cartPreview = document.querySelector('[data-voice-cart]');
  const statusDot = document.querySelector('.voice-dot');
  const statusText = document.querySelector('[data-voice-status]');
  const talkBtn = document.querySelector('[data-voice-talk]');
  const closeBtn = document.querySelector('[data-voice-close]');
  const wave = document.querySelector('.voice_wave');

  let rec = null;
  let listening = false;
  let audio = null;
  let speaking = false;

  function setStatus(text, listeningState){
    if(statusText) statusText.textContent = text;
    if(statusDot) statusDot.classList.toggle('listening', !!listeningState);
    if(wave) wave.hidden = !listeningState;
  }

  function showPanel(){
    panel?.classList.add('open');
    panel?.removeAttribute('hidden');
    btn?.classList.add('pulse');
    speak("Hello, welcome to Deluxe Manna. I'm your receptionist. What would you like to order today? You can say, for example, two beef skewers and a puff puffs.");
    setStatus('Ready — tap Talk', false);
  }
  function hidePanel(){
    panel?.classList.remove('open');
    stopListening();
    stopSpeaking();
    setStatus('Idle', false);
    btn?.classList.remove('pulse');
    setTimeout(()=> panel?.setAttribute('hidden',''), 300);
  }

  btn?.addEventListener('click', ()=> panel?.classList.contains('open') ? hidePanel() : showPanel());
  closeBtn?.addEventListener('click', hidePanel);
  document.querySelector('[data-voice-cart-open]')?.addEventListener('click', ()=>{ document.querySelector('.cart-drawer')?.classList.add('open'); document.querySelector('.cart-backdrop')?.classList.add('open'); document.body.style.overflow='hidden'; });

  // TTS via Cartesia proxy with fallback to browser
  async function speak(text){
    if(!text) return;
    replyEl && (replyEl.textContent = text);
    // Try Cartesia
    try{
      const r = await fetch('/api/tts', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ transcript: text })
      });
      if(r.ok){
        const buf = await r.arrayBuffer();
        const blob = new Blob([buf], {type:'audio/wav'});
        const url = URL.createObjectURL(blob);
        stopSpeaking();
        audio = new Audio(url);
        speaking = true;
        setStatus('Speaking…', false);
        audio.onended = ()=>{ speaking=false; setStatus('Ready — tap Talk', false); };
        await audio.play();
        return;
      }
      throw new Error('TTS failed '+r.status);
    }catch(e){
      // fallback to browser speech
      if('speechSynthesis' in window){
        speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(text);
        u.rate = 1; u.pitch = 1;
        speaking = true; setStatus('Speaking…', false);
        u.onend = ()=>{ speaking=false; setStatus('Ready — tap Talk', false); };
        speechSynthesis.speak(u);
      }
    }
  }
  function stopSpeaking(){
    if(audio){ audio.pause(); audio = null; }
    if('speechSynthesis' in window) speechSynthesis.cancel();
    speaking = false;
  }

  // STT via Web Speech
  function ensureRec(){
    if(rec) return rec;
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if(!SR){
      replyEl && (replyEl.textContent = 'Voice not supported in this browser. Try Chrome on desktop.');
      return null;
    }
    rec = new SR();
    rec.lang = 'en-GB';
    rec.interimResults = true;
    rec.continuous = false;
    rec.maxAlternatives = 1;
    rec.onstart = ()=>{ listening=true; setStatus('Listening…', true); transcriptEl && (transcriptEl.innerHTML='<em>Listening…</em>'); };
    rec.onresult = (e)=>{
      const txt = Array.from(e.results).map(r=> r[0].transcript).join('');
      const isFinal = e.results[0].isFinal;
      if(transcriptEl) transcriptEl.textContent = txt;
      if(isFinal) handleTranscript(txt);
    };
    rec.onerror = (e)=>{ listening=false; setStatus('Error: '+e.error, false); };
    rec.onend = ()=>{ listening=false; if(transcriptEl && !transcriptEl.textContent) setStatus('Tap Talk to speak', false); else setStatus('Ready — tap Talk', false); };
    return rec;
  }

  function startListening(){
    const r = ensureRec();
    if(!r) return;
    try{ r.start(); }catch{}
  }
  function stopListening(){
    try{ rec?.stop(); }catch{}
    listening=false;
  }

  talkBtn?.addEventListener('click', ()=>{
    if(speaking) stopSpeaking();
    if(listening) stopListening();
    else startListening();
  });

  // Parse order: quantity + dish name fuzzy match
  const NUM_WORDS = { a:1, an:1, one:1, two:2, three:3, four:4, five:5, six:6, seven:7, eight:8, nine:9, ten:10 };
  function parseOrder(text){
    const low = text.toLowerCase();
    const results = [];
    // Build patterns for each menu item: check if name words appear
    menu.forEach(item=>{
      const nameWords = item.name.toLowerCase().replace(/\(.*\)/,'').split(/[^a-z]+/).filter(Boolean);
      // fuzzy: at least 1 significant word matches
      const significant = nameWords.filter(w=> w.length>3);
      const hit = significant.some(w=> low.includes(w)) || low.includes(item.name.toLowerCase().split(' ')[0]);
      if(!hit) return;
      // find quantity before the hit
      let qty = 1;
      // look for number before name
      const idx = low.indexOf(significant.find(w=> low.includes(w)) || nameWords[0] || '');
      const before = low.slice(Math.max(0, idx-20), idx);
      const m = before.match(/(\d+)|(\b(one|two|three|four|five|six|seven|eight|nine|ten|a|an)\b)/);
      if(m){
        if(m[1]) qty = parseInt(m[1],10);
        else if(m[0]) qty = NUM_WORDS[m[0].trim()] || 1;
      }
      // also check for "x 2" after
      const after = low.slice(idx, idx+30);
      const m2 = after.match(/x\s*(\d+)/);
      if(m2) qty = parseInt(m2[1],10);
      results.push({ id:item.id, name:item.name, qty, price:item.price_pence });
    });
    // Deduplicate by id, sum qty
    const map = new Map();
    results.forEach(r=>{ if(map.has(r.id)) map.get(r.id).qty+=r.qty; else map.set(r.id,{...r}); });
    return [...map.values()];
  }

  function handleTranscript(text){
    if(!text.trim()) return;
    transcriptEl && (transcriptEl.textContent = text);
    const items = parseOrder(text);
    if(items.length===0){
      // try help
      if(/cart|basket|show/i.test(text)){
        speak("Your basket is open. You can see it live on the right.");
        document.querySelector('.cart-drawer')?.classList.add('open');
        document.querySelector('.cart-backdrop')?.classList.add('open');
        return;
      }
      if(/hello|hi/i.test(text)){
        speak("Hello! Tell me what you'd like. For example, add two tilapia or a manna platter.");
        return;
      }
      speak("Sorry, I didn't catch a dish. Try saying two beef skewers or a tilapia, and I'll add it to your basket.");
      return;
    }
    // Add to cart live
    let added = [];
    items.forEach(it=>{
      for(let i=0;i<it.qty;i++){
        // use DM_CART
        const fakeEl = document.getElementById(`dish-${it.id}`)?.querySelector('.mv2-dish-photo') || document.querySelector('.cart-trigger');
        const img = document.getElementById(`dish-${it.id}`)?.querySelector('img')?.src || '';
        if(window.DM_CART?.addItem){
          window.DM_CART.addItem(it.id, 1, fakeEl, img);
        } else {
          // fallback to localStorage directly
          try{
            const key='dm-cart-v1';
            let cart = JSON.parse(localStorage.getItem(key)||'[]');
            const ex = cart.find(x=>x.id===it.id);
            if(ex) ex.qty+=1; else cart.push({ id:it.id, name:it.name, price:it.price, image:'', qty:1 });
            localStorage.setItem(key, JSON.stringify(cart));
            window.dispatchEvent(new Event('storage'));
          }catch{}
        }
      }
      added.push(`${it.qty} ${it.name}`);
    });
    updateCartPreview();
    const summary = added.join(' and ');
    speak(`Added ${summary} to your basket. You can see it live in the cart. Anything else?`);
    // haptic
    if(navigator.vibrate) navigator.vibrate(20);
  }

  function updateCartPreview(){
    if(!cartPreview) return;
    try{
      const cart = JSON.parse(localStorage.getItem('dm-cart-v1')||'[]');
      if(!cart.length){ cartPreview.innerHTML='<em style="color:var(--muted)">Basket empty</em>'; return; }
      cartPreview.innerHTML = cart.map(i=> `<div style="display:flex; justify-content:space-between; font-size:13px"><span>${i.qty}× ${i.name}</span><span>£${((i.price*i.qty)/100).toFixed(2)}</span></div>`).join('') + `<div style="margin-top:8px; font-weight:700; display:flex; justify-content:space-between"><span>Total</span><span>£${(cart.reduce((s,x)=>s+x.price*x.qty,0)/100).toFixed(2)}</span></div>`;
    }catch{ cartPreview.innerHTML=''; }
  }

  // Keep preview live
  setInterval(updateCartPreview, 900);
  window.addEventListener('storage', updateCartPreview);
  // Also watch cart drawer open
  const obs = new MutationObserver(updateCartPreview);
  const drawer = document.querySelector('.cart-drawer');
  if(drawer) obs.observe(drawer, { attributes:true, childList:true, subtree:true });

  // Auto-load menu if not yet
  if(!menu.length) setTimeout(loadMenu, 1200);

  // Expose
  window.DM_VOICE = { speak, startListening, hidePanel, showPanel };
})();
