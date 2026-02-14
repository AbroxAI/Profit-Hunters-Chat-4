// realism-engine-v11.js (final - patched, non-blocking startup, safe persistence)
// Exposes window.realism: { postFromPoolV11, triggerTrendingReactionV11, simulateRandomCrowdV11, ensurePoolV11, LONG_TERM_POOL_V11, MESSAGE_STATS, GENERATED_TEXTS_V11 }

(function(){
  // ---------- state ----------
  const GENERATED_TEXTS_V11 = new Set();
  const GENERATED_QUEUE = []; // FIFO for LRU eviction (store fingerprints)
  const LONG_TERM_POOL_V11 = []; // pre-generated message pool
  const MESSAGE_STATS = new Map(); // id -> {views, reactions: Map, createdAt, popularity}

  // ---------- content pools ----------
  const ASSETS = ["EUR/USD","USD/JPY","GBP/USD","AUD/USD","BTC/USD","ETH/USD","USD/CHF","EUR/JPY","NZD/USD","US30","NAS100"];
  const BROKERS = ["IQ Option","Binomo","Pocket Option","Deriv","Olymp Trade"];
  const TIMEFRAMES = ["M1","M5","M15","M30","H1","H4"];
  const RESULT_WORDS = ["green","red","profit","loss","win","missed entry","recovered","swing trade success","scalped nicely","small win","big win","partial loss","recovered loss"];
  const TESTIMONIALS = [
    "Made $450 in 2 hours using Abrox",
    "Closed 3 trades, all green today ✅",
    "Recovered a losing trade thanks to Abrox",
    "7 days straight of consistent profit 💹",
    "Abrox saved me from a $200 loss",
    "50% ROI in a single trading session 🚀",
    "Signal timing was perfect today",
    "Day trading USD/JPY with this bot has been a game-changer",
    "Scalped 5 trades successfully today 🚀",
    "Missed entry but recovered in the second push",
    "Made $120 in micro trades this session",
    "Hedged correctly thanks to bot signals",
    "Small wins add up over time, Abrox is legit",
    "Profit on NAS100 was surprisingly easy",
    "Accuracy is insane, never missed an entry"
  ];

  // ---------- utilities ----------
  function random(arr){ return arr[Math.floor(Math.random()*arr.length)]; }
  function maybe(p){ return Math.random() < p; }
  function rand(max=9999){ return Math.floor(Math.random()*max); }

  // DJB2 stable fingerprint
  function djb2(str){
    let h = 5381;
    for(let i=0;i<str.length;i++) h = ((h << 5) + h) + str.charCodeAt(i);
    // return as base36 short string
    return (h >>> 0).toString(36);
  }
  function normalizeText(t){
    return String(t || "").toLowerCase().replace(/[\W\d_]+/g," ").trim().substring(0,300);
  }

  // ---------- dedupe / LRU ----------
  function markGenerated(text){
    const norm = normalizeText(text);
    const fp = djb2(norm);
    if(GENERATED_TEXTS_V11.has(fp)) return false;
    GENERATED_TEXTS_V11.add(fp);
    GENERATED_QUEUE.push(fp);
    const cap = (window.REALISM_CONFIG && window.REALISM_CONFIG.DEDUP_LIMIT) || 50000;
    if(GENERATED_QUEUE.length > cap){
      const old = GENERATED_QUEUE.shift();
      GENERATED_TEXTS_V11.delete(old);
    }
    return true;
  }

  // ---------- persistence (safe serialize/restore) ----------
  const PERSIST_KEY = "abrox_realism_state_v1";

  function serializeMessageStatsForStorage(){
    const out = [];
    for(const [id, st] of MESSAGE_STATS.entries()){
      let reactionsArr = [];
      if(st && st.reactions){
        if(st.reactions instanceof Map) reactionsArr = Array.from(st.reactions.entries());
        else if(Array.isArray(st.reactions)) reactionsArr = st.reactions;
        else reactionsArr = Object.entries(st.reactions || {});
      }
      out.push([id, { views: st.views || 0, reactions: reactionsArr, createdAt: st.createdAt || Date.now(), popularity: st.popularity || 0 }]);
    }
    return out;
  }

  function restoreMessageStatsFromStorage(serializedArray){
    try{
      MESSAGE_STATS.clear();
      if(!Array.isArray(serializedArray)) return;
      for(const [id, st] of serializedArray){
        const reactionsMap = new Map(Array.isArray(st.reactions) ? st.reactions : []);
        MESSAGE_STATS.set(id, { views: st.views || 0, reactions: reactionsMap, createdAt: st.createdAt || Date.now(), popularity: st.popularity || 0 });
      }
    } catch(e){
      console.warn("restoreMessageStatsFromStorage failed", e);
    }
  }

  function loadRealismState(){
    try{
      const raw = localStorage.getItem(PERSIST_KEY);
      if(!raw) return;
      const s = JSON.parse(raw);
      if(Array.isArray(s.generatedQueue)){
        s.generatedQueue.forEach(fp => { GENERATED_QUEUE.push(fp); GENERATED_TEXTS_V11.add(fp); });
      }
      if(s.messageStats) restoreMessageStatsFromStorage(s.messageStats);
      console.log("realism-state loaded:", { fingerprints: GENERATED_QUEUE.length, messageStats: MESSAGE_STATS.size });
    } catch(e){
      console.warn("loadRealismState failed", e);
    }
  }

  function saveRealismState(){
    try{
      const dump = {
        generatedQueue: GENERATED_QUEUE.slice(-((window.REALISM_CONFIG && window.REALISM_CONFIG.DEDUP_LIMIT) || 50000)),
        messageStats: serializeMessageStatsForStorage()
      };
      localStorage.setItem(PERSIST_KEY, JSON.stringify(dump));
    } catch(e){
      console.warn("saveRealismState failed", e);
    }
  }

  loadRealismState();
  window.addEventListener("beforeunload", saveRealismState);
  setInterval(saveRealismState, 1000 * 60 * 2);

  // ---------- timestamp generator ----------
  function generateTimestamp(pastDaysMax = 30){
    // returns a Date within the last `pastDaysMax` days (randomized)
    const now = Date.now();
    const delta = Math.floor(Math.random() * pastDaysMax * 24 * 60 * 60 * 1000);
    return new Date(now - delta - Math.floor(Math.random() * 1000 * 60 * 60));
  }

  // ---------- message generation ----------
  function generateTradingCommentV11(){
    const templates = [
      () => `Guys, ${random(TESTIMONIALS)}`,
      () => `Anyone trading ${random(ASSETS)} on ${random(BROKERS)}?`,
      () => `Signal for ${random(ASSETS)} ${random(TIMEFRAMES)} is ${random(RESULT_WORDS)}`,
      () => `Waiting for ${random(ASSETS)} news impact`,
      () => `Did anyone catch ${random(ASSETS)} reversal?`,
      () => `FOMOing or waiting for pullback on ${random(ASSETS)}?`,
      () => `My last trade on ${random(ASSETS)} was ${random(RESULT_WORDS)}`
    ];
    let text = random(templates)();
    if(maybe(0.18)){
      text = text.replace(/\w{6,}/g, word => {
        if(maybe(0.22)){
          const i = Math.max(1, Math.floor(Math.random()*(word.length-2)));
          return word.substring(0,i) + word[i+1] + word[i] + word.substring(i+2);
        }
        return word;
      });
    }
    if(maybe(0.30)) text += " " + random(["💸","🚀","📈","🔥","✅"]);
    // dedupe attempts
    let attempts = 0;
    while(!markGenerated(text) && attempts < 20){
      text += " " + rand(999);
      attempts++;
    }
    return { text, timestamp: generateTimestamp(40) };
  }

  // ---------- pool builder (non-blocking) ----------
  function ensurePoolV11(minSize = (window.REALISM_CONFIG && window.REALISM_CONFIG.POOL_MIN) || 400){
    // Fill LONG_TERM_POOL_V11 with generated items up to minSize
    while(LONG_TERM_POOL_V11.length < minSize){
      const item = generateTradingCommentV11();
      // persona assignment deferred to rendering time: we only store text and timestamp
      LONG_TERM_POOL_V11.push(item);
      if(LONG_TERM_POOL_V11.length > ((window.REALISM_CONFIG && window.REALISM_CONFIG.POOL_MAX) || 1200)) break;
    }
    return LONG_TERM_POOL_V11.length;
  }

  // ---------- renderer-safe post helper ----------
  function safeAppendMessage(persona, text, opts){
    // Wait until TGRenderer available; retry a few times if not
    const maxAttempts = 30;
    let attempts = 0;
    (function tryAppend(){
      attempts++;
      if(window.TGRenderer && typeof window.TGRenderer.appendMessage === "function"){
        const id = window.TGRenderer.appendMessage(persona, text, opts);
        if(id) MESSAGE_STATS.set(id, { views: rand(8)+1, reactions: new Map(), createdAt: Date.now(), popularity: 0 });
        return;
      }
      if(attempts < maxAttempts) setTimeout(tryAppend, 300);
      else console.warn("TGRenderer not available; message dropped:", text.substring(0,80));
    })();
  }

  // ---------- posting from pool ----------
  function postFromPoolV11(count = 1, personaPicker){
    // personaPicker: optional function that returns a persona object { name, avatar, ... }
    ensurePoolV11(Math.max((window.REALISM_CONFIG && window.REALISM_CONFIG.POOL_MIN) || 400, count));
    // Post items staggered so DOM & CPU don't spike
    const stagger = 120; // ms between individual posts
    for(let i=0;i<count;i++){
      const item = LONG_TERM_POOL_V11.shift();
      if(!item) break;
      (function(it, idx){
        setTimeout(()=>{
          // create a light typing illusion then append
          const persona = (typeof personaPicker === "function") ? personaPicker() : (window.identity ? window.identity.getRandomPersona() : { name: "User", avatar: "https://ui-avatars.com/api/?name=U" });
          if(window.TGRenderer && window.TGRenderer.showTyping) window.TGRenderer.showTyping(persona, 700 + Math.random()*1200);
          setTimeout(()=>{
            safeAppendMessage(persona, it.text, { timestamp: it.timestamp, type: "incoming" });
          }, 700 + Math.random()*900);
        }, idx * stagger);
      })(item, i);
    }
  }

  // ---------- triggered reaction generator ----------
  function triggerTrendingReactionV11(baseText, personaPicker){
    if(!baseText) return;
    const replies = rand(4)+1;
    for(let i=0;i<replies;i++){
      setTimeout(()=>{
        const item = generateTradingCommentV11();
        const persona = (typeof personaPicker === "function") ? personaPicker() : (window.identity ? window.identity.getRandomPersona() : { name: "User", avatar: "https://ui-avatars.com/api/?name=U" });
        safeAppendMessage(persona, item.text, { timestamp: item.timestamp, type: "incoming", replyToText: baseText });
      }, 700*(i+1) + rand(900));
    }
  }

  // ---------- schedule / crowd simulation ----------
  let _crowdTimer = null;
  function scheduleNext(){
    const cfg = window.REALISM_CONFIG || {};
    const min = cfg.MIN_INTERVAL_MS || 15000;
    const max = cfg.MAX_INTERVAL_MS || 45000;
    const interval = min + Math.floor(Math.random() * (max - min));
    const jitter = Math.floor(Math.random() * 4000);
    _crowdTimer = setTimeout(()=>{ postFromPoolV11(1); scheduleNext(); }, interval + jitter);
  }
  function simulateRandomCrowdV11(){
    if(_crowdTimer) clearTimeout(_crowdTimer);
    // start schedule only after small delay so page finishes initialization
    setTimeout(scheduleNext, 600);
  }

  // ---------- reaction tick (update views and emoji reactions in UI) ----------
  function updateMessageStatsInUI(messageId, stats){
    try{
      const el = document.querySelector(`[data-id="${messageId}"]`);
      if(!el) return;
      const reactionsContainer = el.querySelector(".tg-reactions");
      if(reactionsContainer){
        reactionsContainer.innerHTML = "";
        stats.reactions.forEach((count, emoji) => {
          const pill = document.createElement("div");
          pill.className = "tg-reaction";
          pill.textContent = `${emoji} ${count}`;
          reactionsContainer.appendChild(pill);
        });
      }
      const metaSeen = el.querySelector(".tg-bubble-meta .seen");
      if(metaSeen) metaSeen.innerHTML = `<i data-lucide="eye"></i> ${stats.views}`;
      // refresh icons
      if(window.lucide && typeof window.lucide.createIcons === "function") window.lucide.createIcons();
    }catch(e){}
  }

  function reactionTick(){
    MESSAGE_STATS.forEach((stats, id) => {
      const inc = maybe(0.6) ? rand(2) : 0;
      stats.views += inc;
      if(maybe(0.08)){
        const emoji = random(["👍","❤️","🔥","😂","👏"]);
        stats.reactions.set(emoji, (stats.reactions.get(emoji) || 0) + 1);
      }
      if(maybe((window.REALISM_CONFIG && window.REALISM_CONFIG.TREND_SPIKE_PROB) || 0.03)) stats.popularity += rand(6) + 3;
      updateMessageStatsInUI(id, stats);
    });
  }

  const _reactionInterval = setInterval(reactionTick, (window.REALISM_CONFIG && window.REALISM_CONFIG.REACTION_TICK_MS) || 25000);

  // ---------- public API exposure ----------
  window.realism = window.realism || {};
  Object.assign(window.realism, {
    postFromPoolV11,
    triggerTrendingReactionV11,
    simulateRandomCrowdV11,
    ensurePoolV11,
    LONG_TERM_POOL_V11,
    MESSAGE_STATS,
    GENERATED_TEXTS_V11
  });

  // ---------- startup (non-blocking) ----------
  (function startup(){
    // ensure a reasonable pool minimum exists
    const initialPool = (window.REALISM_CONFIG && window.REALISM_CONFIG.INITIAL_POOL) || 500;
    const initialImmediate = Math.min(40, Math.max(8, Math.floor((initialPool) * 0.06))); // post a small slice immediately
    ensurePoolV11(Math.min(initialPool, 1200)); // prepare some pool
    // staggered initial posting to avoid freeze
    setTimeout(()=> postFromPoolV11(initialImmediate), 700);
    // schedule rest to post gradually
    setTimeout(()=> simulateRandomCrowdV11(), 1400);
    console.log("realism-engine started: immediate posts:", initialImmediate, "pool size:", LONG_TERM_POOL_V11.length);
  })();

})();
