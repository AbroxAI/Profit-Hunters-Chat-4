// interactions.js - input handling, send event, Contact Admin hooks, context auto-reply
document.addEventListener("DOMContentLoaded", ()=> {
  const input = document.getElementById("tg-comment-input");
  const sendBtn = document.getElementById("tg-send-btn");
  const emojiBtn = document.getElementById("tg-emoji-btn");
  const cameraBtn = document.getElementById("tg-camera-btn");
  const contactAdminLink = window.CONTACT_ADMIN_LINK || "https://t.me/your_admin";
  const metaLine = document.getElementById("tg-meta-line");

  if(metaLine) metaLine.textContent = `${(window.MEMBER_COUNT||1284).toLocaleString()} members, ${window.ONLINE_COUNT||128} online`;

  function toggleSendButton(){
    const hasText = input.value.trim().length > 0;
    if(hasText){ sendBtn.classList.remove("hidden"); emojiBtn.classList.add("hidden"); cameraBtn.classList.add("hidden"); } else { sendBtn.classList.add("hidden"); emojiBtn.classList.remove("hidden"); cameraBtn.classList.remove("hidden"); }
  }
  input.addEventListener("input", toggleSendButton);

  function doSendMessage(){
    const text = input.value.trim(); if(!text) return;
    const ev = new CustomEvent("sendMessage", { detail: { text }});
    document.dispatchEvent(ev); input.value = ""; toggleSendButton();
  }
  sendBtn.addEventListener("click", doSendMessage);
  input.addEventListener("keydown", (e)=>{ if(e.key === "Enter"){ e.preventDefault(); doSendMessage(); } });

  document.addEventListener("click", (e) => {
    const target = e.target.closest && e.target.closest(".contact-admin-btn");
    if(target){ const href = target.dataset.href || contactAdminLink; window.open(href, "_blank"); e.preventDefault(); }
  });

  document.addEventListener("messageContext", (ev)=> {
    const info = ev.detail; const persona = window.identity ? window.identity.getRandomPersona() : { name:"User", avatar:"https://ui-avatars.com/api/?name=U" };
    setTimeout(()=> {
      const replyText = window.identity ? window.identity.generateHumanComment(persona, "Nice point!") : "Nice!";
      const replyEv = new CustomEvent("autoReply", { detail: { parentText: info.text, persona, text: replyText } });
      document.dispatchEvent(replyEv);
    }, 800 + Math.random()*1200);
  });
});
