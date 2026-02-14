// joiner-simulator.js - spawn joiners, update header meta, optional welcome messages
(function(){
  if(!window.identity || !window.TGRenderer) return;
  const JOIN_CONFIG = Object.assign({ minIntervalMs: 1000*60*60*6, maxIntervalMs: 1000*60*60*24, burstProb:0.02, initialJoins:3, welcomeMessage:"Welcome! Read pinned rules.", showWelcomeInChat:true }, window.JOINER_CONFIG || {});
  const metaEl = document.getElementById("tg-meta-line");
  const MemberState = { total: window.MEMBER_COUNT || 1284, online: window.ONLINE_COUNT || 128 };

  function createJoinerPersona(){
    const p = window.identity.getRandomPersona();
    let name = p.name, attempts=0;
    while(window.identity.ConversationMemory && window.identity.ConversationMemory[name] && attempts<30){ name = p.name + "_" + Math.floor(Math.random()*900+100); attempts++; }
    p.name = name;
    if(window.identity.ConversationMemory) window.identity.ConversationMemory[p.name] = p.memory || [];
    return p;
  }

  function spawnJoiner(opts={}){
    const persona = opts.persona || createJoinerPersona();
    MemberState.total += 1;
    MemberState.online = Math.max(1, MemberState.online + (Math.random()<0.5?1:0));
    if(metaEl) metaEl.textContent = `${MemberState.total.toLocaleString()} members, ${MemberState.online} online`;
    const joinText = `${persona.name} joined the group`;
    const sys = { name:"System", avatar:"assets/admin.jpg" };
    window.TGRenderer.appendMessage(sys, joinText, { timestamp: new Date(), type:"incoming" });
    if(opts.postHello !== false){
      const hello = Math.random()<0.7 ? `Hey everyone 👋 I'm ${persona.name}` : `Hello!`;
      window.TGRenderer.showTyping(persona, 900 + Math.random()*1800);
      setTimeout(()=> window.TGRenderer.appendMessage(persona, hello, { timestamp: new Date(), type:"incoming" }), 1000 + Math.random()*1800);
    }
    if(JOIN_CONFIG.showWelcomeInChat && JOIN_CONFIG.welcomeMessage){
      const admin = window.identity.Admin;
      setTimeout(()=> window.TGRenderer.appendMessage(admin, JOIN_CONFIG.welcomeMessage, { timestamp: new Date(), type:"outgoing" }), 2000 + Math.random()*1200);
    }
    return persona;
  }

  let _joinTimer = null;
  function scheduleNext(){ const base = JOIN_CONFIG.minIntervalMs + Math.floor(Math.random() * (JOIN_CONFIG.maxIntervalMs - JOIN_CONFIG.minIntervalMs)); const burst = Math.random()<JOIN_CONFIG.burstProb ? (Math.random()*60000 + 30000) : 0; const interval = Math.floor(base + burst); _joinTimer = setTimeout(()=>{ spawnJoiner(); scheduleNext(); }, interval); }
  function start(){ for(let i=0;i<JOIN_CONFIG.initialJoins;i++) setTimeout(()=> spawnJoiner({ postHello:true }), 300*i); scheduleNext(); }
  function stop(){ if(_joinTimer) clearTimeout(_joinTimer); _joinTimer=null; }

  window.joiner = { spawnJoiner, start, stop, MemberState };
  setTimeout(()=> window.joiner.start(), 3000);
})();
