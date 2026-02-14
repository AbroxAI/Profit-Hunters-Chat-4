// identity-personas.js (final)
// - Admin uses assets/admin.jpg
// - All other personas use URL avatars exclusively
// - Mixed 40-avatar pool + uploaded-avatar preference
// - Avatar uniqueness persisted to localStorage
// - Persona pool built in non-blocking batches to avoid freezing the browser
// - Exposes window.identity API and helpers

(function(){
  // ---------- Admin ----------
  const Admin = {
    name: "Profit Hunter 🌐",
    avatar: "assets/admin.jpg",
    isAdmin: true,
    gender: "male",
    country: "GLOBAL",
    personality: "authority",
    tone: "direct",
    timezoneOffset: 0,
    rhythm: 1,
    memory: []
  };

  // ---------- Config / Country groups ----------
  const COUNTRY_GROUPS = {
    US:"western", UK:"western", CA:"western", AU:"western",
    DE:"western", FR:"western", IT:"western", ES:"western",
    NL:"western", SE:"western", CH:"western", BE:"western",
    NG:"african", ZA:"african",
    IN:"asian", JP:"asian", KR:"asian",
    BR:"latin", MX:"latin",
    RU:"eastern"
  };
  const COUNTRIES = Object.keys(COUNTRY_GROUPS);

  // ---------- Data pools (names, slang, etc.) ----------
  const MALE_FIRST = ["Alex","John","Max","Leo","Sam","David","Liam","Noah","Ethan","James","Ryan","Michael","Daniel","Kevin","Oliver","William","Henry","Jack","Mason","Lucas","Elijah","Benjamin","Sebastian","Logan","Jacob","Wyatt","Carter","Julian","Luke","Isaac","Nathan","Aaron","Adrian","Victor","Caleb","Dominic","Xavier","Evan","Connor","Jason"];
  const FEMALE_FIRST = ["Maria","Lily","Emma","Zoe","Ivy","Sophia","Mia","Olivia","Ava","Charlotte","Amelia","Ella","Grace","Chloe","Hannah","Aria","Scarlett","Luna","Ruby","Sofia","Emily","Layla","Nora","Victoria","Aurora","Isabella","Madison","Penelope","Camila","Stella","Hazel","Violet","Savannah","Bella","Claire"];
  const LAST_NAMES = ["Smith","Johnson","Brown","Taylor","Anderson","Thomas","Jackson","White","Harris","Martin","Thompson","Garcia","Martinez","Robinson","Clark","Rodriguez","Lewis","Walker","Hall","Allen","Young","King","Wright","Scott","Green","Baker","Adams","Nelson","Hill","Campbell"];
  const CRYPTO_ALIASES = ["BlockKing","PumpMaster","CryptoWolf","FomoKing","Hodler","MoonWalker","TraderJoe","BitHunter","AltcoinAce","ChainGuru","DeFiLord","MetaWhale","CoinSniper","YieldFarmer","NFTDegen","ChartWizard","TokenShark","AirdropKing","WhaleHunter","BullRider"];
  const TITLES = ["Trader","Investor","HODLer","Analyst","Whale","Shark","Mooner","Scalper","SwingTrader","DeFi","Miner","Blockchain","NFT","Quant","Signals","Mentor"];
  const EMOJIS = ["💸","🔥","💯","✨","😎","👀","📈","🚀","💰","🤑","🎯","🏆","🤖","🎉","🍀","📊","⚡","💎","👑","🦄","🧠","🔮","🪙","🥂","💡","🛸","📉","💲","📱","💬"];

  const SLANG = {
    western:["bro","ngl","lowkey","fr","tbh","wild","solid move","bet","dope","lit","clutch","savage","meme","cheers","respect","hype","flex","mad","cap","no cap","real talk","yo","fam","legit","sick"],
    african:["my guy","omo","chai","no wahala","sharp move","gbam","yawa","sweet","jollof","palava","chop","hustle","ehen","kolo","sisi","big man","on point","correct","naija","vibe"],
    asian:["lah","brother","steady","respect","solid one","ok lah","si","good move","ganbatte","wa","neat","nice one","yah","cool","steady bro"],
    latin:["amigo","vamos","muy bueno","dale","epa","chevere","que pasa","pura vida","mano","buenisimo","vale","chido"],
    eastern:["comrade","strong move","not bad","serious play","da","top","good work","correct","bravo","nice move"]
  };

  // ---------- Mixed avatar pool (40 URLs) ----------
  const MIXED_AVATAR_POOL = [
    // pravatar
    "https://i.pravatar.cc/300?img=3","https://i.pravatar.cc/300?img=5","https://i.pravatar.cc/300?img=7","https://i.pravatar.cc/300?img=9","https://i.pravatar.cc/300?img=11",
    "https://i.pravatar.cc/300?img=13","https://i.pravatar.cc/300?img=15","https://i.pravatar.cc/300?img=17","https://i.pravatar.cc/300?img=18","https://i.pravatar.cc/300?img=20",
    // randomuser
    "https://randomuser.me/api/portraits/men/21.jpg","https://randomuser.me/api/portraits/women/22.jpg","https://randomuser.me/api/portraits/men/23.jpg","https://randomuser.me/api/portraits/women/24.jpg",
    "https://randomuser.me/api/portraits/men/25.jpg","https://randomuser.me/api/portraits/women/26.jpg","https://randomuser.me/api/portraits/men/27.jpg","https://randomuser.me/api/portraits/women/28.jpg",
    // picsum seeds
    "https://picsum.photos/seed/alpha/300/300","https://picsum.photos/seed/bravo/300/300","https://picsum.photos/seed/charlie/300/300","https://picsum.photos/seed/delta/300/300","https://picsum.photos/seed/echo/300/300",
    "https://picsum.photos/seed/foxtrot/300/300","https://picsum.photos/seed/golf/300/300","https://picsum.photos/seed/hotel/300/300","https://picsum.photos/seed/india/300/300","https://picsum.photos/seed/juliet/300/300",
    // robohash
    "https://robohash.org/seed_a.png","https://robohash.org/seed_b.png","https://robohash.org/seed_c.png","https://robohash.org/seed_d.png","https://robohash.org/seed_e.png","https://robohash.org/seed_f.png",
    // multiavatar
    "https://api.multiavatar.com/seed_one.png","https://api.multiavatar.com/seed_two.png","https://api.multiavatar.com/seed_three.png","https://api.multiavatar.com/seed_four.png","https://api.multiavatar.com/seed_five.png","https://api.multiavatar.com/seed_six.png"
  ];

  // ---------- Persistence: used avatar URLs ----------
  const AVATAR_PERSIST_KEY = "abrox_used_avatars_v1";
  const UsedAvatarURLs = new Set();
  (function loadUsedAvs(){
    try{
      const raw = localStorage.getItem(AVATAR_PERSIST_KEY);
      if(!raw) return;
      const arr = JSON.parse(raw);
      if(Array.isArray(arr)) arr.forEach(u => UsedAvatarURLs.add(u));
    }catch(e){
      // corrupt data -> ignore and allow system to repopulate
      console.warn("loadUsedAvs failed:", e);
    }
  })();
  function saveUsedAvs(){
    try{ localStorage.setItem(AVATAR_PERSIST_KEY, JSON.stringify(Array.from(UsedAvatarURLs))); }catch(e){ console.warn("saveUsedAvs failed:", e); }
  }
  // periodic save & beforeunload
  setInterval(saveUsedAvs, 1000 * 60 * 2);
  window.addEventListener("beforeunload", saveUsedAvs);

  // ---------- Utilities ----------
  function random(arr){ return arr[Math.floor(Math.random()*arr.length)]; }
  function maybe(p){ return Math.random() < p; }
  function rand(max=9999){ return Math.floor(Math.random()*max); }

  // ---------- Unique avatar picker ----------
  function pickUniqueFromArray(arr){
    if(!arr || !arr.length) return null;
    const copy = arr.slice();
    for(let i = copy.length - 1; i > 0; i--){
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    for(const candidate of copy){
      const n = String(candidate).trim();
      if(!n) continue;
      if(n === "assets/admin.jpg") continue; // never reassign admin avatar
      if(!UsedAvatarURLs.has(n)){
        UsedAvatarURLs.add(n);
        // persist asap
        try{ saveUsedAvs(); }catch(e){}
        return n;
      }
    }
    return null;
  }

  function buildUniqueAvatar(name, gender){
    // Prefer uploaded (hosted) avatars provided by you
    const uploaded = Array.isArray(window.UPLOADED_AVATARS) ? window.UPLOADED_AVATARS.slice() : [];
    if(uploaded.length){
      const pick = pickUniqueFromArray(uploaded);
      if(pick) return pick;
    }

    // Prefer our curated mixed pool
    const mixPick = pickUniqueFromArray(MIXED_AVATAR_POOL);
    if(mixPick) return mixPick;

    // Safe generator fallbacks (try unique)
    const fallbacks = [
      `https://randomuser.me/api/portraits/${gender==="male"?"men":"women"}/${rand(99)}.jpg`,
      `https://i.pravatar.cc/300?img=${rand(70)}`,
      `https://source.unsplash.com/collection/3652192/300x300?sig=${rand(10000)}`,
      `https://picsum.photos/seed/${encodeURIComponent(name+rand())}/300/300`,
      `https://robohash.org/${encodeURIComponent(name+rand())}.png`,
      `https://api.multiavatar.com/${encodeURIComponent(name+rand())}.png`,
      `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&size=256`
    ];
    const f = pickUniqueFromArray(fallbacks);
    if(f) return f;

    // final fallback: initials
    const initial = name && name.length ? name.charAt(0).toUpperCase() : "U";
    const fallback = `https://ui-avatars.com/api/?name=${initial}&background=random&size=256`;
    UsedAvatarURLs.add(fallback);
    try{ saveUsedAvs(); }catch(e){}
    return fallback;
  }

  // ---------- Name builder ----------
  function buildUniqueName(gender){
    // Mix real names, aliases, titles and sometimes emoji
    if(maybe(0.12)){
      // crypto alias variant
      let base = random(CRYPTO_ALIASES) + (maybe(0.6) ? " " + random(TITLES) : "");
      if(maybe(0.6)) base += " " + rand(999);
      if(maybe(0.4)) base += " " + random(EMOJIS);
      return base;
    }
    let base = (gender==="male" ? random(MALE_FIRST) : random(FEMALE_FIRST)) + " " + random(LAST_NAMES);
    if(maybe(0.45)) base += " " + random(TITLES);
    if(maybe(0.55)) base += rand(999);
    if(maybe(0.45)) base = base.replace(/\s+/g, maybe(0.5) ? "_" : ".");
    if(maybe(0.45)) base += " " + random(EMOJIS);
    return base.trim();
  }

  // ---------- Persona generator ----------
  function generateSyntheticPersona(){
    const gender = maybe(0.5) ? "male" : "female";
    const country = random(COUNTRIES);
    const region = COUNTRY_GROUPS[country];
    const name = buildUniqueName(gender);
    const persona = {
      name,
      avatar: buildUniqueAvatar(name, gender),
      isAdmin: false,
      gender,
      country,
      region,
      personality: random(["hype","analytical","casual","quiet","aggressive"]),
      tone: random(["short","normal","long"]),
      timezoneOffset: rand(24)-12,
      rhythm: (0.6 + Math.random()*1.8),
      lastSeen: Date.now() - rand(6000000),
      memory: [],
      sentiment: random(["bullish","neutral","bearish"])
    };
    return persona;
  }

  // ---------- Pool (non-blocking build) ----------
  const SyntheticPool = [];
  const ConversationMemory = {};
  const DEFAULT_TOTAL = (window.REALISM_CONFIG && window.REALISM_CONFIG.TOTAL_PERSONAS) || 1200;
  const TOTAL_PERSONAS = Math.max(100, Math.min(DEFAULT_TOTAL, 20000)); // clamp to safe bounds

  // build a safe initial synchronous chunk to allow immediate operation
  const INITIAL_SYNC = Math.min(200, TOTAL_PERSONAS);
  for(let i=0;i<INITIAL_SYNC;i++){
    const p = generateSyntheticPersona();
    SyntheticPool.push(p);
    ConversationMemory[p.name] = p.memory;
  }

  // fill remaining asynchronously in batches to avoid freezing the UI
  const REMAINING = TOTAL_PERSONAS - INITIAL_SYNC;
  if(REMAINING > 0){
    const BATCH = 200;
    let filled = 0;
    function fillBatch(){
      const toDo = Math.min(BATCH, REMAINING - filled);
      for(let i=0;i<toDo;i++){
        const p = generateSyntheticPersona();
        SyntheticPool.push(p);
        ConversationMemory[p.name] = p.memory;
      }
      filled += toDo;
      // allow other events to run, then continue if needed
      if(filled < REMAINING) setTimeout(fillBatch, 120);
      else console.log("SyntheticPool fully built:", SyntheticPool.length);
    }
    // start after a short delay so page can render
    setTimeout(fillBatch, 100);
  } else {
    console.log("SyntheticPool built (small):", SyntheticPool.length);
  }

  // ---------- Human comment generator ----------
  function generateHumanComment(persona, baseText, targetName=null){
    let text = baseText || "Nice!";
    // add slang sometimes
    if(maybe(0.45)){
      const slangCount = rand(2)+1;
      const slangWords = [];
      for(let i=0;i<slangCount;i++) slangWords.push(random(SLANG[persona.region] || []));
      text = slangWords.join(" ") + " " + text;
    }
    // tone-based truncation or extension
    if(persona.tone === "short") text = text.split(" ").slice(0,8).join(" ");
    if(persona.tone === "long") text += " honestly this setup looks strong if volume confirms.";
    // occasional realistic typo (rare)
    if(maybe(0.12)){
      text = text.replace(/\w{6,}/g, word => {
        if(maybe(0.22)){
          const i = Math.max(1, Math.floor(Math.random()*(word.length-2)));
          return word.substring(0,i) + word[i+1] + word[i] + word.substring(i+2);
        }
        return word;
      });
    }
    // emoji
    if(maybe(0.35)) text += " " + random(EMOJIS);
    // @target
    if(targetName && maybe(0.25)) text = "@" + targetName + " " + text;
    // save to persona memory (bounded)
    persona.memory = persona.memory || [];
    if(persona.memory.length > 200) persona.memory.shift();
    persona.memory.push(text);
    ConversationMemory[persona.name] = persona.memory;
    return text;
  }

  // ---------- last seen helper ----------
  function getLastSeenStatus(persona){
    const diff = Date.now() - persona.lastSeen;
    if(diff < 300000) return "online";
    if(diff < 3600000) return "last seen recently";
    if(diff < 86400000) return "last seen today";
    return "last seen long ago";
  }

  // ---------- utility helpers for operations ----------
  function getRandomPersona(){ return SyntheticPool.length ? SyntheticPool[Math.floor(Math.random()*SyntheticPool.length)] : { name: "Guest", avatar: "https://ui-avatars.com/api/?name=G&background=random" }; }
  function getPersona(opts={}){ return opts.type === "admin" ? Admin : getRandomPersona(); }

  // ---------- helper: reassign avatars for existing pool using mixed pool (useful after edits) ----------
  function reassignAvatarsFromPool(){
    if(!SyntheticPool || !SyntheticPool.length) return;
    for(const persona of SyntheticPool){
      if(persona.isAdmin) continue;
      // only reassign if avatar is missing or collides
      if(!persona.avatar || UsedAvatarURLs.has(persona.avatar) && Array.from(UsedAvatarURLs).filter(x=>x===persona.avatar).length>1){
        persona.avatar = buildUniqueAvatar(persona.name, persona.gender);
      }
      // ensure recorded as used
      if(persona.avatar && !UsedAvatarURLs.has(persona.avatar)){
        UsedAvatarURLs.add(persona.avatar);
      }
    }
    try{ saveUsedAvs(); }catch(e){}
    console.log("Reassigned avatars for pool; used avatars:", UsedAvatarURLs.size);
  }

  // ---------- helper: wait for full pool to finish building (returns a Promise) ----------
  function waitForFullPool(timeoutMs = 120000){
    return new Promise((resolve) => {
      const start = Date.now();
      (function poll(){
        if(SyntheticPool.length >= TOTAL_PERSONAS) return resolve(true);
        if(Date.now() - start > timeoutMs) return resolve(false);
        setTimeout(poll, 200);
      })();
    });
  }

  // ---------- export API ----------
  window.identity = window.identity || {};
  Object.assign(window.identity, {
    Admin,
    getRandomPersona,
    getPersona,
    generateHumanComment,
    getLastSeenStatus,
    ConversationMemory,
    SyntheticPool,
    UsedAvatarURLs,
    EMOJIS,
    reassignAvatarsFromPool,
    waitForFullPool
  });

  // quick debug log (non-blocking)
  console.log("identity-personas initialized. initial pool:", SyntheticPool.length, "target:", TOTAL_PERSONAS);
})();
