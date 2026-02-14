// identity-personas.js (final)
// 40-mixed avatar pool, uploaded avatar preference, no duplicate avatar URLs, large persona pool

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

const COUNTRY_GROUPS = { US:"western", UK:"western", CA:"western", AU:"western", DE:"western", FR:"western", IT:"western", ES:"western", NL:"western", SE:"western", CH:"western", BE:"western", NG:"african", ZA:"african", IN:"asian", JP:"asian", KR:"asian", BR:"latin", MX:"latin", RU:"eastern" };
const COUNTRIES = Object.keys(COUNTRY_GROUPS);

const MALE_FIRST = ["Alex","John","Max","Leo","Sam","David","Liam","Noah","Ethan","James","Ryan","Michael","Daniel","Kevin","Oliver","William","Henry","Jack","Mason","Lucas","Elijah","Benjamin","Sebastian","Logan","Jacob","Wyatt","Carter","Julian","Luke","Isaac","Nathan","Aaron","Adrian","Victor","Caleb","Dominic","Xavier","Evan","Connor","Jason"];
const FEMALE_FIRST = ["Maria","Lily","Emma","Zoe","Ivy","Sophia","Mia","Olivia","Ava","Charlotte","Amelia","Ella","Grace","Chloe","Hannah","Aria","Scarlett","Luna","Ruby","Sofia","Emily","Layla","Nora","Victoria","Aurora","Isabella","Madison","Penelope","Camila","Stella","Hazel","Violet","Savannah","Bella","Claire"];
const LAST_NAMES = ["Smith","Johnson","Brown","Taylor","Anderson","Thomas","Jackson","White","Harris","Martin","Thompson","Garcia","Martinez","Robinson","Clark","Rodriguez","Lewis","Walker","Hall","Allen","Young","King","Wright","Scott","Green","Baker","Adams","Nelson","Hill","Campbell"];
const CRYPTO_ALIASES = ["BlockKing","PumpMaster","CryptoWolf","FomoKing","Hodler","MoonWalker","TraderJoe","BitHunter","AltcoinAce","ChainGuru","DeFiLord","MetaWhale","CoinSniper","YieldFarmer","NFTDegen","ChartWizard","TokenShark","AirdropKing","WhaleHunter","BullRider"];
const TITLES = ["Trader","Investor","HODLer","Analyst","Whale","Shark","Mooner","Scalper","SwingTrader","DeFi","Miner","Blockchain","NFT","Quant","Signals","Mentor"];
const EMOJIS = ["💸","🔥","💯","✨","😎","👀","📈","🚀","💰","🤑","🎯","🏆","🤖","🎉","🍀","📊","⚡","💎","👑","🦄","🧠","🔮","🪙","🥂","💡","🛸","📉","💲","📱","💬"];

const SLANG = {
  western:["bro","ngl","lowkey","fr","tbh","wild","solid move","bet","dope","lit","clutch","savage","meme","cheers","respect","hype","flex","mad","cap","no cap","real talk","yo","fam","legit","sick","bangin","cringe"],
  african:["my guy","omo","chai","no wahala","sharp move","gbam","yawa","sweet","jollof","palava","chop","fine boy","hustle","ehen","kolo","sisi","big man","on point","correct","wahala no","naija","bros","guyz","mumu","gbosa","vibe"],
  asian:["lah","brother","steady","respect","solid one","ok lah","si","good move","shi","ganbatte","wa","neat","ke","nice one","yah","bro lah","cool","steady bro","solid bro","aiyo","yah lah","okey","ma","ganbatte ne","broshi","good bro"],
  latin:["amigo","vamos","muy bueno","fuerte move","dale","epa","buenisimo","chevere","que pasa","vamo","oye","pura vida","mano","buena","apta","vamos ya","olé","sí","bacano","rico","tranquilo","hermano","qué tal","vale","sí pues","chido","vamos amigo"],
  eastern:["comrade","strong move","not bad","serious play","da","top","okey","nu","excellent","good work","correct","bravo","fine","nice move","pro","cheers","well done","solid play","serious one","good lad","da bro","top move","excellent play"]
};

const MIXED_AVATAR_POOL = [
  "https://i.pravatar.cc/300?img=3","https://i.pravatar.cc/300?img=5","https://i.pravatar.cc/300?img=7","https://i.pravatar.cc/300?img=9","https://i.pravatar.cc/300?img=11","https://i.pravatar.cc/300?img=13","https://i.pravatar.cc/300?img=15","https://i.pravatar.cc/300?img=17","https://i.pravatar.cc/300?img=18","https://i.pravatar.cc/300?img=20",
  "https://randomuser.me/api/portraits/men/21.jpg","https://randomuser.me/api/portraits/women/22.jpg","https://randomuser.me/api/portraits/men/23.jpg","https://randomuser.me/api/portraits/women/24.jpg","https://randomuser.me/api/portraits/men/25.jpg","https://randomuser.me/api/portraits/women/26.jpg","https://randomuser.me/api/portraits/men/27.jpg","https://randomuser.me/api/portraits/women/28.jpg",
  "https://picsum.photos/seed/alpha/300/300","https://picsum.photos/seed/bravo/300/300","https://picsum.photos/seed/charlie/300/300","https://picsum.photos/seed/delta/300/300","https://picsum.photos/seed/echo/300/300","https://picsum.photos/seed/foxtrot/300/300","https://picsum.photos/seed/golf/300/300","https://picsum.photos/seed/hotel/300/300","https://picsum.photos/seed/india/300/300","https://picsum.photos/seed/juliet/300/300",
  "https://robohash.org/seed_a.png","https://robohash.org/seed_b.png","https://robohash.org/seed_c.png","https://robohash.org/seed_d.png","https://robohash.org/seed_e.png","https://robohash.org/seed_f.png",
  "https://api.multiavatar.com/seed_one.png","https://api.multiavatar.com/seed_two.png","https://api.multiavatar.com/seed_three.png","https://api.multiavatar.com/seed_four.png","https://api.multiavatar.com/seed_five.png","https://api.multiavatar.com/seed_six.png"
];

// Persistence for used avatars
const UsedAvatarURLs = new Set();
const AVATAR_PERSIST_KEY = "abrox_used_avatars_v1";
(function loadUsedAvs(){
  try{
    const r = localStorage.getItem(AVATAR_PERSIST_KEY);
    if(r){ JSON.parse(r).forEach(u => UsedAvatarURLs.add(u)); }
  } catch(e) { console.warn("loadUsedAvs", e); }
})();
window.addEventListener("beforeunload", ()=> { try{ localStorage.setItem(AVATAR_PERSIST_KEY, JSON.stringify(Array.from(UsedAvatarURLs))); }catch(e){} });

// Helpers
function random(arr){ return arr[Math.floor(Math.random()*arr.length)]; }
function maybe(p){ return Math.random() < p; }
function rand(max=9999){ return Math.floor(Math.random()*max); }

function buildUniqueName(gender){
  let base = (gender==="male"?random(MALE_FIRST):random(FEMALE_FIRST)) + " " + random(LAST_NAMES);
  if(maybe(0.45)) base += " " + random(TITLES);
  if(maybe(0.55)) base += rand(999);
  if(maybe(0.45)) base = base.replace(/\s+/g, maybe(0.5) ? "_" : ".");
  if(maybe(0.45)) base += " " + random(EMOJIS);
  return base.trim();
}

function pickUniqueFromArray(arr){
  if(!arr || !arr.length) return null;
  const copy = arr.slice();
  for(let i = copy.length - 1; i > 0; i--){
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  for(const candidate of copy){
    const n = String(candidate).trim();
    if(n === "assets/admin.jpg") continue;
    if(!UsedAvatarURLs.has(n)){ UsedAvatarURLs.add(n); try{ localStorage.setItem(AVATAR_PERSIST_KEY, JSON.stringify(Array.from(UsedAvatarURLs))); }catch(e){} return n; }
  }
  return null;
}

function buildUniqueAvatar(name, gender){
  const uploaded = Array.isArray(window.UPLOADED_AVATARS) ? window.UPLOADED_AVATARS.slice() : [];
  // prefer uploaded avatars
  if(uploaded.length){
    const p = pickUniqueFromArray(uploaded);
    if(p) return p;
  }
  // then mixed 40 pool
  const m = pickUniqueFromArray(MIXED_AVATAR_POOL);
  if(m) return m;
  // fallback generators (unique attempts)
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
  try{ localStorage.setItem(AVATAR_PERSIST_KEY, JSON.stringify(Array.from(UsedAvatarURLs))); }catch(e){}
  return fallback;
}

// Persona generator & pool
const SyntheticPool = [];
const ConversationMemory = {};
const TOTAL_PERSONAS = (window.REALISM_CONFIG && window.REALISM_CONFIG.TOTAL_PERSONAS) || 1200;

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
    lastSeen: Date.now()-rand(6000000),
    memory: [],
    sentiment: random(["bullish","neutral","bearish"])
  };
  ConversationMemory[persona.name] = persona.memory;
  return persona;
}

for(let i=0;i<TOTAL_PERSONAS;i++) SyntheticPool.push(generateSyntheticPersona());

// Helpers & export
function getRandomPersona(){ return random(SyntheticPool); }
function getPersona(opts={}){ return opts.type === "admin" ? Admin : getRandomPersona(); }

function generateHumanComment(persona, baseText, targetName=null){
  let text = baseText || "Nice!";
  if(maybe(0.45)){
    const slangCount = rand(2)+1; const slangWords=[];
    for(let i=0;i<slangCount;i++) slangWords.push(random(SLANG[persona.region]||[]));
    text = slangWords.join(" ") + " " + text;
  }
  if(persona.tone==="short") text = text.split(" ").slice(0,8).join(" ");
  if(persona.tone==="long") text += " this looks solid; watching volume.";
  if(maybe(0.18)){
    text = text.replace(/\w{6,}/g, word => { if(maybe(0.28)){ const i = Math.max(1, Math.floor(Math.random()*(word.length-2))); return word.substring(0,i)+word[i+1]+word[i]+word.substring(i+2); } return word; });
  }
  if(maybe(0.35)) text += " " + random(EMOJIS);
  if(targetName && maybe(0.25)) text = "@"+targetName+" "+text;
  persona.memory.push(text);
  return text;
}

function getLastSeenStatus(persona){
  const diff = Date.now() - persona.lastSeen;
  if(diff < 300000) return "online";
  if(diff < 3600000) return "last seen recently";
  if(diff < 86400000) return "last seen today";
  return "last seen long ago";
}

window.identity = { Admin, getRandomPersona, getPersona, generateHumanComment, getLastSeenStatus, ConversationMemory, SyntheticPool, UsedAvatarURLs, EMOJIS };
