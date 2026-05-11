const { onRequest } = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");
const express = require("express");
const cors = require("cors");
const OpenAI = require("openai");

// Initialize express for the chat endpoint
const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

// We'll use Firebase Secrets to store the API key safely
// Access via process.env.NVIDIA_API_KEY
const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY;
const NVIDIA_BASE_URL = "https://integrate.api.nvidia.com/v1";

app.post("/chat", async (req, res) => {
  const { messages, model } = req.body;

  try {
    const response = await fetch(`${NVIDIA_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${NVIDIA_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: model || "deepseek-ai/deepseek-v4-pro",
        messages: messages,
        temperature: 1,
        top_p: 0.95,
        max_tokens: 16384,
        stream: true,
        chat_template_kwargs: { thinking: false }
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      logger.error("NVIDIA API Error:", response.status, errorData);
      return res.status(response.status).json(errorData);
    }

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      res.write(value);
    }

    res.end();
  } catch (error) {
    logger.error("Backend Error:", error);
    res.status(500).json({ error: "Failed to connect to NVIDIA API" });
  }
});

// Export the function
exports.chat = onRequest({ 
  secrets: ["NVIDIA_API_KEY"],
  cors: true,
  region: "us-central1" // Default region
}, app);
