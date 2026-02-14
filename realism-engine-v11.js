// realism-engine-v11.js (final — patched persistence + djb2 dedupe + large pool)
// Exposes window.realism API

const GENERATED_TEXTS_V11 = new Set();
const GENERATED_QUEUE = []; // FIFO LRU
const LONG_TERM_POOL_V11 = [];
const MESSAGE_STATS = new Map();

const ASSETS = ["EUR/USD","USD/JPY","GBP/USD","AUD/USD","BTC/USD","ETH/USD","USD/CHF","EUR/JPY","NZD/USD","US30","NAS100"];
const BROKERS = ["IQ Option","Binomo","Pocket Option","Deriv","Olymp Trade"];
const TIMEFRAMES = ["M1","M5","M15","M30","H1","H4"];
const RESULT_WORDS = ["green","red","profit","loss","win","missed entry","recovered","swing trade success","scalped nicely","small win","big win"];
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

// DJB2 hash
function djb2(str){
  let h = 5381;
  for(let i=0;i<str.length;i++) h = ((h << 5) + h) + str.charCodeAt(i);
  return (h >>> 0).toString(36);
}
function normalizeText(t){
  return String(t).toLowerCase().replace(/[\W\d_]+/g," ").trim().substring(0,300);
}

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

// Persistence helpers (serialize / restore MESSAGE_STATS safely)
const PERSIST_KEY = "abrox_realism_state_v1";

function serializeMessageStatsForStorage() {
  const out = [];
  for (const [id, st] of MESSAGE_STATS.entries()) {
    let reactionsArr = [];
    if (st && st.reactions) {
      if (st.reactions instanceof Map) reactionsArr = Array.from(st.reactions.entries());
      else if (Array.isArray(st.reactions)) reactionsArr = st.reactions;
      else reactionsArr = Object.entries(st.reactions || {});
    }
    out.push([id, { views: st.views || 0, reactions: reactionsArr, createdAt: st.createdAt || Date.now(), popularity: st.popularity || 0 }]);
  }
  return out;
}

function restoreMessageStatsFromStorage(serializedArray) {
  try {
    MESSAGE_STATS.clear();
    if (!Array.isArray(serializedArray)) return;
    for (const [id, st] of serializedArray) {
      const reactionsMap = new Map(Array.isArray(st.reactions) ? st.reactions : []);
      MESSAGE_STATS.set(id, { views: st.views || 0, reactions: reactionsMap, createdAt: st.createdAt || Date.now(), popularity: st.popularity || 0 });
    }
  } catch (e) {
    console.warn("restoreMessageStatsFromStorage failed", e);
  }
}

function loadRealismState(){
  try{
    const raw = localStorage.getItem(PERSIST_KEY);
    if(!raw) return;
    const s = JSON.parse(raw);
    if (Array.isArray(s.generatedQueue)) {
      s.generatedQueue.forEach(fp=> { GENERATED_QUEUE.push(fp); GENERATED_TEXTS_V11.add(fp); });
    }
    if (s.messageStats) restoreMessageStatsFromStorage(s.messageStats);
    console.log("Realism state loaded:", { fingerprints: GENERATED_QUEUE.length, messageStats: MESSAGE_STATS.size });
  }catch(e){ console.warn("loadRealismState", e); }
}
function saveRealismState(){
  try{
    const dump = {
      generatedQueue: GENERATED_QUEUE.slice(-((window.REALISM_CONFIG && window.REALISM_CONFIG.DEDUP_LIMIT) || 50000)),
      messageStats: serializeMessageStatsForStorage()
    };
    localStorage.setItem(PERSIST_KEY, JSON.stringify(dump));
  }catch(e){ console.warn("saveRealismState failed", e); }
}
loadRealismState();
setInterval(saveRealismState, 1000*60*2);
window.addEventListener("beforeunload", saveRealismState);

// util
function random(arr){ return arr[Math.floor(Math.random()*arr.length)]; }
function maybe(p){ return Math.random() < p; }
function rand(max=9999){ return Math.floor(Math.random()*max); }

function generateTimestamp(offsetDays=0){
  const now = new Date();
  if(offsetDays > 0){
    const d = new Date(now); d.setDate(now.getDate() - offsetDays); d.setHours(9 + rand(8), rand(60), rand(60)); return d;
  }
  return new Date(now - Math.floor(Math.random()*1000*60*60*24));
}

function getRandomPersona(){ return (window.identity && window.identity.getRandomPersona) ? window.identity.getRandomPersona() : { name:"User", avatar:"https://ui-avatars.com/api/?name=U" }; }

function generateTradingCommentV11(){
  const persona = getRandomPersona();
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
    text = text.replace(/\w{6,}/g, word => { if(maybe(0.22)){ const i = Math.max(1, Math.floor(Math.random()*(word.length-2))); return word.substring(0,i)+word[i+1]+word[i]+word.substring(i+2); } return word; });
  }
  if(maybe(0.35)) text += " " + (window.identity && window.identity.EMOJIS ? random(window.identity.EMOJIS) : "💸");

  // dedupe
  let attempts = 0;
  while(!markGenerated(text) && attempts < 20){ text += " " + rand(999); attempts++; }
  return { persona, text, timestamp: generateTimestamp(0) };
}

// pool & posting
function ensurePoolV11(minSize = (window.REALISM_CONFIG ? window.REALISM_CONFIG.POOL_MIN : 400)){
  while(LONG_TERM_POOL_V11.length < minSize){
    LONG_TERM_POOL_V11.push(generateTradingCommentV11());
    if(LONG_TERM_POOL_V11.length > ((window.REALISM_CONFIG && window.REALISM_CONFIG.POOL_MAX) || 1200)) break;
  }
}

function postFromPoolV11(count=1){
  ensurePoolV11(count);
  for(let i=0;i<count;i++){
    const item = LONG_TERM_POOL_V11.shift();
    (function(it, idx){
      setTimeout(()=>{
        if(window.TGRenderer && window.TGRenderer.showTyping) window.TGRenderer.showTyping(it.persona, 800 + Math.random()*1200);
        setTimeout(()=>{
          if(window.TGRenderer && window.TGRenderer.appendMessage){
            const id = window.TGRenderer.appendMessage(it.persona, it.text, { timestamp: it.timestamp, type: "incoming" });
            if(id) MESSAGE_STATS.set(id, { views: rand(8)+1, reactions: new Map(), createdAt: Date.now(), popularity: 0 });
          }
        }, 700 + Math.random()*1000);
      }, idx*120);
    })(item, i);
  }
}

// trending replies
function triggerTrendingReactionV11(baseText){
  if(!baseText) return;
  const replies = rand(4)+1;
  for(let i=0;i<replies;i++){
    setTimeout(()=>{
      const c = generateTradingCommentV11();
      if(window.TGRenderer && window.TGRenderer.appendMessage){
        const id = window.TGRenderer.appendMessage(c.persona, c.text, { timestamp: c.timestamp, type:"incoming", replyToText: baseText });
        if(id) MESSAGE_STATS.set(id, { views: rand(4)+1, reactions: new Map(), createdAt: Date.now(), popularity: 0 });
      }
    }, 800*(i+1) + rand(900));
  }
}

// schedule posting
let _crowdTimer = null;
function scheduleNext(){
  const cfg = window.REALISM_CONFIG || {};
  const min = cfg.MIN_INTERVAL_MS || 15000;
  const max = cfg.MAX_INTERVAL_MS || 45000;
  const interval = min + Math.floor(Math.random() * (max - min));
  const jitter = Math.floor(Math.random()*4000);
  _crowdTimer = setTimeout(()=>{ postFromPoolV11(1); scheduleNext(); }, interval + jitter);
}
function simulateRandomCrowdV11(){ if(_crowdTimer) clearTimeout(_crowdTimer); scheduleNext(); }

// reaction tick & UI update helper
function updateMessageStatsInUI(messageId, stats){
  try{
    const el = document.querySelector(`[data-id="${messageId}"]`);
    if(!el) return;
    const reactionsContainer = el.querySelector(".tg-reactions");
    if(reactionsContainer){
      reactionsContainer.innerHTML = "";
      stats.reactions.forEach((count, emoji) => { const pill = document.createElement("div"); pill.className = "tg-reaction"; pill.textContent = `${emoji} ${count}`; reactionsContainer.appendChild(pill); });
    }
    const metaSeen = el.querySelector(".tg-bubble-meta .seen");
    if(metaSeen) metaSeen.innerHTML = `<i data-lucide="eye"></i> ${stats.views}`;
    lucide.createIcons();
  }catch(e){}
}

function reactionTick(){
  MESSAGE_STATS.forEach((stats, id) => {
    const inc = maybe(0.6) ? rand(2) : 0;
    stats.views += inc;
    if(maybe(0.08)){ const emoji = random(["👍","❤️","🔥","😂","👏"]); stats.reactions.set(emoji, (stats.reactions.get(emoji)||0) + 1); }
    if(maybe((window.REALISM_CONFIG && window.REALISM_CONFIG.TREND_SPIKE_PROB) || 0.03)) stats.popularity += rand(6)+3;
    updateMessageStatsInUI(id, stats);
  });
}
const _reactionInterval = setInterval(reactionTick, (window.REALISM_CONFIG && window.REALISM_CONFIG.REACTION_TICK_MS) || 25000);

// public API
window.realism = { postFromPoolV11, triggerTrendingReactionV11, simulateRandomCrowdV11, ensurePoolV11, LONG_TERM_POOL_V11, MESSAGE_STATS, GENERATED_TEXTS_V11 };

// startup
ensurePoolV11((window.REALISM_CONFIG && window.REALISM_CONFIG.INITIAL_POOL) || 500);
postFromPoolV11(Math.min((window.REALISM_CONFIG && window.REALISM_CONFIG.INITIAL_POOL) || 500, 700));
simulateRandomCrowdV11();
