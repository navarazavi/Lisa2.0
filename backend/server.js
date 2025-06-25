import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import axios from "axios";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const CLAUDE_API_KEY = process.env["lisa2-key"];

app.use(cors());
app.use(express.json());

// __dirname workaround for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve static frontend
app.use(express.static(path.join(__dirname, "../frontend")));

// Load inventory from JSON
const inventoryDataPath = path.join(__dirname, "ro_supply_data.json");
let inventoryData = [];

try {
  const rawData = fs.readFileSync(inventoryDataPath, "utf-8");
  inventoryData = JSON.parse(rawData);
  console.log(`📦 Loaded ${inventoryData.length} inventory items`);
} catch (err) {
  console.error("❌ Failed to load inventory data:", err.message);
}

// Claude route
app.post("/ask-lisa", async (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ error: "Message is required" });

  const today = new Date();
  const todayStr = today.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const inventoryString = inventoryData.map(item => {
    const name = item["Ingredient"] || "Unnamed item";
    const qty = parseFloat(item["Current Inventory (g)"] || 0);
    const usage = parseFloat(item["Monthly Usage Forecast (g)"] || 0);
    const deliveryDateStr = item["Next Confirmed Delivery"] || "N/A";

    let stockoutMessage = "";
    if (!isNaN(qty) && !isNaN(usage) && usage > 0) {
      const daysRemaining = Math.floor((qty / usage) * 30.33); // using ~4.33 weeks/month
      const stockoutDate = new Date(today.getTime() + daysRemaining * 24 * 60 * 60 * 1000);
      stockoutMessage = ` Projected to run out in ~${daysRemaining} days, around ${stockoutDate.toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
      })}.`;
    }

    let deliveryMessage = "";
    if (deliveryDateStr && deliveryDateStr !== "N/A") {
      const deliveryDate = new Date(deliveryDateStr);
      if (!isNaN(deliveryDate)) {
        const daysUntilDelivery = Math.floor((deliveryDate - today) / (1000 * 60 * 60 * 24));
        deliveryMessage = ` Next delivery is in ${daysUntilDelivery} days (${deliveryDate.toLocaleDateString("en-US", {
          month: "long",
          day: "numeric",
        })}).`;
      }
    }

    return `${name}: ${qty}g in stock, using ${usage}g/month.${stockoutMessage}${deliveryMessage}`;
  }).join("\n");

  const personalityIntro = `You are LISA: the Laboratory Inventory and Supply Chain Assistant. You're smart, witty, and designed to help with lab efficiency. Keep responses concise, less than 2 sentences is ideal. No bullet points or lists. Today's date is ${todayStr}. Here is the current inventory:\n${inventoryString}`;

  try {
    const response = await axios.post(
      "https://api.anthropic.com/v1/messages",
      {
        model: "claude-3-opus-20240229",
        max_tokens: 1024,
        temperature: 0.7,
        messages: [
          {
            role: "user",
            content: `${personalityIntro}\nUser: ${message}`,
          },
        ],
      },
      {
        headers: {
          "x-api-key": CLAUDE_API_KEY,
          "anthropic-version": "2023-06-01",
          "content-type": "application/json",
        },
      }
    );

    res.json({ reply: response.data.content[0].text });
  } catch (err) {
    console.error("Claude API error:", err?.response?.data || err.message);
    res.status(500).json({ error: "Claude API error" });
  }
});

// Fallback to frontend for all other routes
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/index.html"));
});

app.listen(PORT, () => {
  console.log(`💬 Lisa backend listening on port ${PORT}`);
});

