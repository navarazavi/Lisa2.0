window.addEventListener("load", () => {
  const sendBtn = document.getElementById("send-btn");
  const userInput = document.getElementById("user-input");
  const chatBox = document.getElementById("chat-box");

  let typingBubble = null;

  const deliveryNotes = {
    "pectin": "Heads up: the last shipment included an airfreight surcharge — just something to watch for in the future.",
    "citric acid": "All good! Citric acid deliveries have been arriving normally. No drama there.",
    "ascorbic acid": "Yes! It appears the last shipment was rejected due to microbial contamination. We’ll need to double-check the next batch.",
    "magnesium citrate": "There was a supplier backlog reported back in March — things might still be catching up.",
    "gelatin (bovine)": "Ugh, the container got delayed at the port. Classic shipping headache.",
    "stevia extract": "Yep, delivery was confirmed — no issues reported!"
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
          reply = found[1]; // ⬅️ Use only the friendly message, no prefix
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
