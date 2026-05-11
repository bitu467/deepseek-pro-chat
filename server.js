import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.post('/api/chat', async (req, res) => {
  const { messages, model } = req.body;

  try {
    const response = await fetch(`${process.env.NVIDIA_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.NVIDIA_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model || process.env.MODEL_NAME || "deepseek-ai/deepseek-v4-pro",
        messages: messages,
        temperature: 1,
        top_p: 0.95,
        max_tokens: 16384,
        stream: true,
        // Include chat_template_kwargs for DeepSeek models
        chat_template_kwargs: { thinking: false }
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('NVIDIA API Error:', response.status, errorData);
      return res.status(response.status).json(errorData);
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // Proxy the stream
    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      res.write(value);
    }

    res.end();
  } catch (error) {
    console.error('Backend Error:', error);
    res.status(500).json({ error: 'Failed to connect to NVIDIA API' });
  }
});

app.listen(port, () => {
  console.log(`Backend server running at http://localhost:${port}`);
});
