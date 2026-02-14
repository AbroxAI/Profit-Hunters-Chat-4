// bubble-renderer.js
// Responsible for rendering chat UI bubbles safely

(function () {

  const chatContainer = document.getElementById("chatContainer");
  if (!chatContainer) {
    console.error("Chat container not found.");
    return;
  }

  const renderedMessageIds = new Set();

  function createDateSticker(dateText) {
    const sticker = document.createElement("div");
    sticker.className = "date-sticker";
    sticker.textContent = dateText;
    return sticker;
  }

  function createReactionBar(reactions = {}) {
    const bar = document.createElement("div");
    bar.className = "reaction-bar";

    Object.entries(reactions).forEach(([emoji, count]) => {
      if (count > 0) {
        const span = document.createElement("span");
        span.className = "reaction";
        span.textContent = `${emoji} ${count}`;
        bar.appendChild(span);
      }
    });

    return bar;
  }

  function createReplyPreview(replyData) {
    const preview = document.createElement("div");
    preview.className = "reply-preview";
    preview.innerHTML = `
      <strong>${replyData.name}</strong>
      <div>${replyData.text.slice(0, 80)}</div>
    `;
    return preview;
  }

  function createAvatar(src, isAdmin = false) {
    const avatar = document.createElement("img");
    avatar.className = "avatar";

    if (isAdmin) {
      avatar.src = "assets/admin.jpg";
    } else {
      avatar.src = src;
    }

    avatar.onerror = function () {
      this.src = "assets/admin.jpg";
    };

    return avatar;
  }

  function createBubble(message) {
    if (renderedMessageIds.has(message.id)) return;
    renderedMessageIds.add(message.id);

    const wrapper = document.createElement("div");
    wrapper.className = "message-wrapper";
    wrapper.dataset.id = message.id;

    if (message.isOwn) {
      wrapper.classList.add("own");
    }

    const avatar = createAvatar(message.avatar, message.isAdmin);

    const bubble = document.createElement("div");
    bubble.className = "bubble";

    // Name
    if (!message.isOwn) {
      const nameEl = document.createElement("div");
      nameEl.className = "name";
      nameEl.textContent = message.name;
      bubble.appendChild(nameEl);
    }

    // Reply preview
    if (message.replyTo) {
      bubble.appendChild(createReplyPreview(message.replyTo));
    }

    // Broadcast image
    if (message.type === "broadcast") {
      const img = document.createElement("img");
      img.src = "assets/broadcast.jpg";
      img.className = "broadcast-image";
      bubble.appendChild(img);
    }

    // Text
    const textEl = document.createElement("div");
    textEl.className = "text";
    textEl.textContent = message.text;
    bubble.appendChild(textEl);

    // Reactions
    if (message.reactions) {
      bubble.appendChild(createReactionBar(message.reactions));
    }

    // Meta (time + seen)
    const meta = document.createElement("div");
    meta.className = "meta";

    const time = document.createElement("span");
    time.className = "time";
    time.textContent = message.time;

    meta.appendChild(time);

    if (message.isOwn) {
      const seen = document.createElement("span");
      seen.className = "seen";
      seen.textContent = "✓✓";
      meta.appendChild(seen);
    }

    bubble.appendChild(meta);

    wrapper.appendChild(avatar);
    wrapper.appendChild(bubble);

    chatContainer.appendChild(wrapper);

    // Auto-scroll smoothly
    chatContainer.scrollTo({
      top: chatContainer.scrollHeight,
      behavior: "smooth"
    });
  }

  function renderMessages(messages = []) {
    messages.forEach(msg => createBubble(msg));
  }

  function clearChat() {
    chatContainer.innerHTML = "";
    renderedMessageIds.clear();
  }

  // Expose globally
  window.BubbleRenderer = {
    renderMessages,
    clearChat
  };

})();
