window.addEventListener("load", () => {
  const sendBtn = document.getElementById("send-btn");
  const userInput = document.getElementById("user-input");
  const chatBox = document.getElementById("chat-box");

  let typingBubble = null;

  const deliveryNotes = {
    "pectin": "Airfreight surcharge applied in last shipment",
    "citric acid": "Normal deliveries",
    "ascorbic acid": "Previous shipment rejected — microbial contamination",
    "magnesium citrate": "Supplier backlog reported in March",
    "gelatin": "Container delayed at port",
    "stevia extract": "Delivery confirmed"
  };

  sendBtn.addEventListener("click", sendMessage);
  userInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") sendMessage();
  });

  async function sendMessage() {
    const message = userInput.value.trim();
    if (!message) return;

    const intro = document.getElementById("intro");
    if (intro) intro.remove();

    const userBubble = document.createElement("div");
    userBubble.classList.add("chat-bubble", "user");
    userBubble.textContent = message;
    chatBox.appendChild(userBubble);
    chatBox.scrollTop = chatBox.scrollHeight;

    userInput.value = "";

    typingBubble = document.createElement("div");
    typingBubble.classList.add("typing-bubble");

    for (let i = 0; i < 3; i++) {
      const dot = document.createElement("span");
      dot.classList.add("dot");
      typingBubble.appendChild(dot);
    }

    chatBox.appendChild(typingBubble);
    chatBox.scrollTop = chatBox.scrollHeight;

    try {
      let reply = "";

      if (message.toLowerCase().includes("note")) {
        const found = Object.entries(deliveryNotes).find(([ingredient]) =>
          message.toLowerCase().includes(ingredient)
        );
        if (found) {
          reply = `${found[0]}: ${found[1]}`;
        }
      }

      if (!reply) {
        const res = await fetch("/ask-lisa", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message }),
        });

        const data = await res.json();
        reply = data.reply || "⚠️ Lisa didn’t reply.";
      }

      if (typingBubble) {
        typingBubble.remove();
        typingBubble = null;
      }

      const lisaBubble = document.createElement("div");
      lisaBubble.classList.add("chat-bubble", "lisa");
      lisaBubble.textContent = "";
      chatBox.appendChild(lisaBubble);
      chatBox.scrollTop = chatBox.scrollHeight;

      let i = 0;
      function typeWriter() {
        if (i < reply.length) {
          lisaBubble.textContent += reply.charAt(i);
          i++;
          setTimeout(typeWriter, 20);
        }
      }
      typeWriter();
    } catch (err) {
      console.error("Fetch error:", err);
      if (typingBubble) {
        typingBubble.remove();
        typingBubble = null;
      }
      const failBubble = document.createElement("div");
      failBubble.classList.add("chat-bubble", "lisa");
      failBubble.textContent = "⚠️ Something went wrong.";
      chatBox.appendChild(failBubble);
    }
  }
});
