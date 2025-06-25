window.addEventListener("load", () => {
  const sendBtn = document.getElementById("send-btn");
  const userInput = document.getElementById("user-input");
  const chatBox = document.getElementById("chat-box");
  const typingIndicator = document.getElementById("typing-indicator");

  sendBtn.addEventListener("click", sendMessage);
  userInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") sendMessage();
  });

  async function sendMessage() {
    const message = userInput.value.trim();
    if (!message) return;

    // 💥 Remove intro message if it exists
    const intro = document.getElementById("intro");
    if (intro) intro.remove();

    // 💬 Add user bubble
    const userBubble = document.createElement("div");
    userBubble.classList.add("chat-bubble", "user");
    userBubble.textContent = message;
    chatBox.appendChild(userBubble);
    chatBox.scrollTop = chatBox.scrollHeight;

    // Clear input
    userInput.value = "";

    // ✨ Show typing indicator
    if (typingIndicator) {
      typingIndicator.style.display = "inline-block";
      chatBox.scrollTop = chatBox.scrollHeight;
    }

    try {
      const res = await fetch("/ask-lisa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });

      const data = await res.json();
      console.log("Response:", data);

      // ✂️ Hide typing indicator
      if (typingIndicator) {
        typingIndicator.style.display = "none";
      }

      if (data.reply) {
        const lisaBubble = document.createElement("div");
        lisaBubble.classList.add("chat-bubble", "lisa");
        lisaBubble.textContent = "";
        chatBox.appendChild(lisaBubble);
        chatBox.scrollTop = chatBox.scrollHeight;

        let i = 0;
        function typeWriter() {
          if (i < data.reply.length) {
            lisaBubble.textContent += data.reply.charAt(i);
            i++;
            setTimeout(typeWriter, 20);
          }
        }
        typeWriter();
      } else {
        const errorBubble = document.createElement("div");
        errorBubble.classList.add("chat-bubble", "lisa");
        errorBubble.textContent = "⚠️ Lisa didn’t reply.";
        chatBox.appendChild(errorBubble);
      }
    } catch (err) {
      console.error("Fetch error:", err);
      if (typingIndicator) {
        typingIndicator.style.display = "none";
      }
      const failBubble = document.createElement("div");
      failBubble.classList.add("chat-bubble", "lisa");
      failBubble.textContent = "⚠️ Something went wrong.";
      chatBox.appendChild(failBubble);
    }
  }
});
