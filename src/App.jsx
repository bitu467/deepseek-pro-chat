import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Send, Bot, User, Sparkles, Loader2, ChevronDown, Sun, Moon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import './App.css';

const MODELS = [
  { id: 'deepseek-ai/deepseek-v4-pro', name: 'DeepSeek V4 Pro' },
  { id: 'deepseek-ai/deepseek-v4-flash', name: 'DeepSeek V4 Flash' },
  { id: 'meta/llama-3.3-70b-instruct', name: 'Llama 3.3 70B' },
  { id: 'meta/llama-3.1-8b-instruct', name: 'Llama 3.1 8B' },
  { id: 'openai/gpt-oss-20b', name: 'GPT-OSS 20B' }
];

function App() {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: "Hello! I'm DeepSeek Pro. How can I help you today?" }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState(MODELS[0].id);
  const [showModelMenu, setShowModelMenu] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  
  const chatEndRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    if (isDarkMode) {
      document.body.classList.remove('light-mode');
    } else {
      document.body.classList.add('light-mode');
    }
  }, [isDarkMode]);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleInput = (e) => {
    setInput(e.target.value);
    textareaRef.current.style.height = 'auto';
    textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
  };

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    
    if (textareaRef.current) textareaRef.current.style.height = 'auto';

    try {
      // Relative URL for Firebase Hosting rewrites
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          messages: [...messages, userMessage].map(m => ({ role: m.role, content: m.content })),
          model: selectedModel
        }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to connect to backend');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let aiMessageContent = '';
      setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

      let buffer = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop();

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.slice(6).trim();
            if (dataStr === '[DONE]') break;
            
            try {
              const data = JSON.parse(dataStr);
              if (data.choices?.[0]?.delta?.content) {
                aiMessageContent += data.choices[0].delta.content;
                setMessages(prev => {
                  const newMessages = [...prev];
                  newMessages[newMessages.length - 1].content = aiMessageContent;
                  return newMessages;
                });
              }
            } catch (e) {}
          }
        }
      }
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, { role: 'assistant', content: `**Error:** ${error.message}. Please check if the model is available or try a different one.` }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="app-container">
      <header className="header">
        <div className="brand">
          <h1><Sparkles size={24} color="var(--accent-color)" /> DeepSeek Pro</h1>
        </div>
        
        <div className="header-actions">
          <button className="theme-toggle-btn" onClick={toggleTheme} title="Toggle Theme">
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          <div className="model-selector">
            <button className="model-btn" onClick={() => setShowModelMenu(!showModelMenu)}>
              {MODELS.find(m => m.id === selectedModel)?.name}
              <ChevronDown size={16} />
            </button>
            {showModelMenu && (
              <div className="model-menu">
                {MODELS.map(model => (
                  <button 
                    key={model.id} 
                    className={`model-option ${selectedModel === model.id ? 'active' : ''}`}
                    onClick={() => {
                      setSelectedModel(model.id);
                      setShowModelMenu(false);
                    }}
                  >
                    {model.name}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="status-indicator">
            <div className={`dot ${isLoading ? 'active' : ''}`}></div>
            <span>{isLoading ? 'Thinking...' : 'Ready'}</span>
          </div>
        </div>
      </header>

      <main className="chat-window">
        <AnimatePresence>
          {messages.map((msg, index) => (
            <motion.div 
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`message ${msg.role === 'user' ? 'user' : 'ai'}`}
            >
              <div className="message-header" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                {msg.role === 'user' ? <User size={14} /> : <Bot size={14} />}
                <span>{msg.role === 'user' ? 'You' : 'DeepSeek'}</span>
              </div>
              <div className="markdown-content">
                <ReactMarkdown>{msg.content}</ReactMarkdown>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        <div ref={chatEndRef} />
      </main>

      <footer className="input-area">
        <form className="input-wrapper" onSubmit={handleSubmit}>
          <textarea
            ref={textareaRef}
            rows="1"
            value={input}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            placeholder="Ask me anything..."
          />
          <button type="submit" className="send-btn" disabled={isLoading || !input.trim()}>
            {isLoading ? <Loader2 className="animate-spin" size={20} color="#000" /> : <Send size={20} color="#000" />}
          </button>
        </form>
      </footer>
    </div>
  );
}

export default App;
