const { onRequest } = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");
const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

const NVIDIA_BASE_URL = "https://integrate.api.nvidia.com/v1";

app.post("*", async (req, res) => {
  const { messages, model } = req.body;
  const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY;

  if (!NVIDIA_API_KEY) {
    return res.status(400).json({ error: "NVIDIA API Key missing in backend" });
  }

  try {
    // 1. Handle Image Generation Models (NVIDIA)
    const isImageModel = model.includes("flux") || model.includes("stable-diffusion");
    if (isImageModel) {
      const prompt = messages[messages.length - 1].content;
      const response = await fetch(`${NVIDIA_BASE_URL}/images/generations`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${NVIDIA_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ model, prompt, response_format: "url" }),
      });

      if (!response.ok) return res.status(response.status).json(await response.json());
      const data = await response.json();
      return res.json({ image_url: data.data[0].url });
    }

    // 2. Handle Chat Models (NVIDIA - Streaming)
    const response = await fetch(`${NVIDIA_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${NVIDIA_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: model || "meta/llama-3.3-70b-instruct",
        messages: messages,
        temperature: 1,
        top_p: 0.95,
        max_tokens: 4096,
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return res.status(response.status).json(errorData);
    }

    res.setHeader("Content-Type", "text/event-stream");
    const reader = response.body.getReader();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      res.write(value);
    }
    res.end();
  } catch (error) {
    logger.error("Backend Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

exports.chat = onRequest({ 
  secrets: ["NVIDIA_API_KEY"],
  invoker: "public",
  cors: true,
  region: "us-central1",
  maxInstances: 10
}, app);
