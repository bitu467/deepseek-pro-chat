import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Send, Bot, User, Sparkles, Loader2, ChevronDown, Sun, Moon, Columns, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import './App.css';

const MODELS = [
  { id: 'meta/llama-3.3-70b-instruct', name: 'Llama 3.3 70B' },
  { id: 'meta/llama-3.1-8b-instruct', name: 'Llama 3.1 8B' },
  { id: 'openai/gpt-oss-20b', name: 'GPT-OSS 20B' },
  { id: 'deepseek-ai/deepseek-v4-pro', name: 'DeepSeek V4 Pro' },
  { id: 'deepseek-ai/deepseek-v4-flash', name: 'DeepSeek V4 Flash' }
];

function App() {
  const [messages, setMessages] = useState([
    { role: 'assistant', type: 'single', content: "Hello! I'm ready. Use the toggle above to compare models side-by-side!" }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState(MODELS[0].id);
  const [compareList, setCompareList] = useState([MODELS[0].id, MODELS[1].id]);
  const [isCompareMode, setIsCompareMode] = useState(false);
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

  const toggleTheme = () => setIsDarkMode(!isDarkMode);
  const toggleCompare = () => setIsCompareMode(!isCompareMode);

  const toggleModelInCompare = (id) => {
    if (compareList.includes(id)) {
      if (compareList.length > 1) setCompareList(compareList.filter(m => m !== id));
    } else {
      if (compareList.length < 3) setCompareList([...compareList, id]);
    }
  };

  const streamFromModel = async (modelId, history, msgIndex) => {
    try {
      // Point directly to Cloud Run URL to avoid Firebase Hosting rewrite issues
      const response = await fetch('https://chat-fo6ezi7trq-uc.a.run.app/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history, model: modelId }),
      });

      if (!response.ok) throw new Error('Model failed');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let content = '';
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
              const delta = data.choices?.[0]?.delta?.content || '';
              if (delta) {
                content += delta;
                setMessages(prev => {
                  const newMsgs = [...prev];
                  const currentMsg = { ...newMsgs[msgIndex] };
                  currentMsg.results = { ...currentMsg.results, [modelId]: content };
                  newMsgs[msgIndex] = currentMsg;
                  return newMsgs;
                });
              }
            } catch (e) {}
          }
        }
      }
    } catch (error) {
      setMessages(prev => {
        const newMsgs = [...prev];
        const currentMsg = { ...newMsgs[msgIndex] };
        currentMsg.results = { ...currentMsg.results, [modelId]: `Error: ${error.message}` };
        newMsgs[msgIndex] = currentMsg;
        return newMsgs;
      });
    }
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMsg = { role: 'user', content: input };
    const currentHistory = [...messages.filter(m => m.type !== 'compare').map(m => ({ role: m.role, content: m.content || '' })), userMsg];
    
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);
    if (textareaRef.current) textareaRef.current.style.height = 'auto';

    const activeModels = isCompareMode ? compareList : [selectedModel];
    const msgIndex = messages.length + 1;
    
    setMessages(prev => [...prev, { 
      role: 'assistant', 
      type: isCompareMode ? 'compare' : 'single',
      results: activeModels.reduce((acc, id) => ({ ...acc, [id]: '' }), {})
    }]);

    await Promise.all(activeModels.map(modelId => streamFromModel(modelId, currentHistory, msgIndex)));
    setIsLoading(false);
  };

  return (
    <div className={`app-container ${isCompareMode ? 'compare-mode' : ''}`}>
      <header className="header">
        <div className="brand">
          <h1><Sparkles size={24} color="var(--accent-color)" /> DeepSeek Pro</h1>
        </div>
        
        <div className="header-actions">
          <button className={`mode-toggle-btn ${isCompareMode ? 'active' : ''}`} onClick={toggleCompare} title="Compare Mode">
            {isCompareMode ? <MessageSquare size={20} /> : <Columns size={20} />}
          </button>

          <button className="theme-toggle-btn" onClick={toggleTheme}>
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          <div className="model-selector">
            <button className="model-btn" onClick={() => setShowModelMenu(!showModelMenu)}>
              {isCompareMode ? `${compareList.length} Models` : MODELS.find(m => m.id === selectedModel)?.name}
              <ChevronDown size={16} />
            </button>
            {showModelMenu && (
              <div className="model-menu">
                {MODELS.map(model => (
                  <button 
                    key={model.id} 
                    className={`model-option ${isCompareMode ? (compareList.includes(model.id) ? 'active' : '') : (selectedModel === model.id ? 'active' : '')}`}
                    onClick={() => {
                      if (isCompareMode) toggleModelInCompare(model.id);
                      else { setSelectedModel(model.id); setShowModelMenu(false); }
                    }}
                  >
                    {isCompareMode && <input type="checkbox" checked={compareList.includes(model.id)} readOnly style={{ marginRight: '8px' }} />}
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
              className={`message-group ${msg.role === 'user' ? 'user' : 'assistant'}`}
            >
              {msg.role === 'user' ? (
                <div className="message user">
                   <div className="message-header"><User size={14} /> <span>You</span></div>
                   <div className="markdown-content">{msg.content}</div>
                </div>
              ) : (
                <div className={`results-grid cols-${Object.keys(msg.results || {}).length}`}>
                  {Object.entries(msg.results || {}).map(([modelId, content]) => (
                    <div key={modelId} className="message ai">
                      <div className="message-header">
                        <Bot size={14} /> 
                        <span>{MODELS.find(m => m.id === modelId)?.name}</span>
                      </div>
                      <div className="markdown-content">
                        <ReactMarkdown>{content || (isLoading ? '...' : '')}</ReactMarkdown>
                      </div>
                    </div>
                  ))}
                </div>
              )}
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
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSubmit())}
            placeholder="Compare models..."
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
