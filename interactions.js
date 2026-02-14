// interactions.js
// Handles user input, send logic, admin contact button, pin & reply logic

(function () {

  const input = document.getElementById("messageInput");
  const sendBtn = document.getElementById("sendBtn");
  const chatContainer = document.getElementById("chatContainer");
  const contactBtn = document.getElementById("contactAdminBtn");

  if (!chatContainer) {
    console.error("Chat container missing.");
    return;
  }

  let messageCounter = 0;

  function generateId() {
    return "msg_" + Date.now() + "_" + (messageCounter++);
  }

  function getCurrentTime() {
    const now = new Date();
    return now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  function sendUserMessage(text) {
    if (!text || text.trim() === "") return;

    const message = {
      id: generateId(),
      name: "You",
      text: text.trim(),
      time: getCurrentTime(),
      isOwn: true,
      isAdmin: false,
      avatar: null,
      reactions: {}
    };

    window.BubbleRenderer.renderMessages([message]);

    // Notify realism engine
    if (window.RealismEngine && typeof window.RealismEngine.onUserMessage === "function") {
      window.RealismEngine.onUserMessage(message);
    }

    if (input) input.value = "";
  }

  function handleSend() {
    if (!input) return;
    sendUserMessage(input.value);
  }

  if (sendBtn) {
    sendBtn.addEventListener("click", handleSend);
  }

  if (input) {
    input.addEventListener("keydown", function (e) {
      if (e.key === "Enter") {
        e.preventDefault();
        handleSend();
      }
    });
  }

  // Admin contact button
  if (contactBtn) {
    contactBtn.addEventListener("click", function () {
      window.open("https://t.me/ph_suppp", "_blank");
    });
  }

  // Optional: pin scroll safety
  function scrollToMessage(id) {
    const el = document.querySelector(`[data-id="${id}"]`);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  window.Interactions = {
    sendUserMessage,
    scrollToMessage
  };

})();
