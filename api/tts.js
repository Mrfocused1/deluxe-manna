export default async function handler(req, res){
  if(req.method !== 'POST'){
    res.status(405).json({error:'Method not allowed'});
    return;
  }
  const key = process.env.CARTESIA_API_KEY;
  if(!key){
    res.status(500).json({error:'Missing CARTESIA_API_KEY env'});
    return;
  }
  let body = req.body;
  if(typeof body === 'string'){
    try{ body = JSON.parse(body); }catch{ body = {}; }
  }
  const transcript = body.transcript || body.text || '';
  if(!transcript){
    res.status(400).json({error:'Missing transcript'});
    return;
  }
  // Cartesia TTS bytes
  try{
    const r = await fetch('https://api.cartesia.ai/tts/bytes', {
      method: 'POST',
      headers: {
        'Cartesia-Version': '2025-04-16',
        'X-API-Key': key,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model_id: 'sonic-3.5',
        transcript,
        voice: { mode: 'id', id: '79a125e8-cff6-4d48-a8a0-4d3b5e3d8a6c' },
        output_format: { container: 'wav', encoding: 'pcm_s16le', sample_rate: 24000 }
      })
    });
    if(!r.ok){
      const txt = await r.text();
      // fallback error
      res.status(r.status).json({error: txt.slice(0,500)});
      return;
    }
    const buf = Buffer.from(await r.arrayBuffer());
    res.setHeader('Content-Type', 'audio/wav');
    res.setHeader('Cache-Control', 'no-store');
    res.send(buf);
  }catch(e){
    res.status(500).json({error: String(e).slice(0,500)});
  }
}
