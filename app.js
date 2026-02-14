// app.js - admin broadcast/pin flow, sendMessage handling, admin Q&A
document.addEventListener("DOMContentLoaded", () => {
  const pinBanner = document.getElementById("tg-pin-banner");
  const container = document.getElementById("tg-comments-container");
  const contactAdminLink = window.CONTACT_ADMIN_LINK || "https://t.me/your_admin";

  function postAdminBroadcast(){
    const admin = window.identity ? window.identity.Admin : { name:"Admin", avatar:"assets/admin.jpg", isAdmin:true };
    const caption = `📌 Group Rules

- New members are read-only until verified
- Admins do NOT DM directly
- No screenshots in chat
- Ignore unsolicited messages

✅ To verify or contact admin, use the “Contact Admin” button below.`;
    const image = "assets/broadcast.jpg";
    const timestamp = new Date(2025,2,14,10,0,0); // March 14, 2025 10:00
    const id = window.TGRenderer.appendMessage(admin, "Broadcast", { timestamp, type:"outgoing", image, caption });
    return { id, caption, image };
  }

  function showPinBanner(image, caption, pinnedMessageId){
    pinBanner.innerHTML = "";
    const img = document.createElement("img"); img.src = image;
    const text = document.createElement("div"); text.className="pin-text"; text.textContent = (caption||"Pinned message").split("\n")[0];
    const btn = document.createElement("button"); btn.className = "contact-admin-btn"; btn.dataset.href = contactAdminLink; btn.textContent = "Contact Admin";
    pinBanner.appendChild(img); pinBanner.appendChild(text); pinBanner.appendChild(btn);
    pinBanner.classList.remove("hidden"); pinBanner.classList.add("show");
    pinBanner.onclick = ()=> {
      const el = document.querySelector(`[data-id="${pinnedMessageId}"]`);
      if(el){ el.scrollIntoView({behavior:"smooth", block:"center"}); el.classList.add("tg-highlight"); setTimeout(()=> el.classList.remove("tg-highlight"), 2600); }
    };
  }

  function postPinNotice(){
    const system = { name:"System", avatar:"assets/admin.jpg" };
    window.TGRenderer.appendMessage(system, "Admin pinned a message", { timestamp: new Date(), type:"incoming" });
  }

  const broadcast = postAdminBroadcast();
  setTimeout(()=>{
    postPinNotice();
    showPinBanner(broadcast.image, broadcast.caption, broadcast.id);
  }, 2200);

  document.addEventListener("sendMessage", (ev)=> {
    const text = ev.detail.text;
    const persona = window.identity ? window.identity.getRandomPersona() : { name:"You", avatar:"https://ui-avatars.com/api/?name=You" };
    window.TGRenderer.showTyping(persona, 800 + Math.random()*1200);
    setTimeout(()=> {
      window.TGRenderer.appendMessage(persona, text, { timestamp: new Date(), type:"outgoing" });
      if(text.toLowerCase().includes("admin") || text.toLowerCase().includes("contact")){
        const admin = window.identity.Admin;
        window.TGRenderer.showTyping(admin, 1600 + Math.random()*1200);
        setTimeout(()=> window.TGRenderer.appendMessage(admin, "Thanks — please contact via the button on the pinned message. We will respond there.", { timestamp: new Date(), type:"outgoing" }), 1800 + Math.random()*1200);
      }
    }, 1200 + Math.random()*400);
  });

  document.addEventListener("autoReply", (ev) => {
    const { parentText, persona, text } = ev.detail;
    window.TGRenderer.showTyping(persona, 1000 + Math.random()*1200);
    setTimeout(()=> window.TGRenderer.appendMessage(persona, text, { timestamp: new Date(), type:"incoming", replyToText: parentText }), 1200 + Math.random()*800);
  });
});
