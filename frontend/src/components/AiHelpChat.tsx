import { useState, useEffect, useRef } from 'react';
import { Sparkles, Send, X, Bot, MessageSquare } from 'lucide-react';
import { useStore } from '../store/useStore';

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: Date;
}

export default function AiHelpChat() {
  const { nodes, edges, triggerNodeId, loadConfiguration } = useStore();
  const [isOpen, setIsOpen] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text: 'Hello! I am Flowery AI. Describe how you would like to modify your diagram, and I can generate the new architecture for you.',
      timestamp: new Date(),
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll to the bottom of the chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Auto-clear toast
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || isLoading) return;

    const userText = inputMessage.trim();
    setInputMessage('');
    
    // Add user message
    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}-user`,
      sender: 'user',
      text: userText,
      timestamp: new Date(),
    };
    
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      // Post query and current diagram state to the backend
      const response = await fetch('http://localhost:8080/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userText,
          currentDiagram: {
            triggerNodeId,
            nodes,
            edges,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Server returned status ${response.status}`);
      }

      const updatedConfig = await response.json();
      
      // Load the new configuration onto the canvas
      loadConfiguration(updatedConfig);
      
      // Add success response from AI
      setMessages((prev) => [
        ...prev,
        {
          id: `msg-${Date.now()}-ai`,
          sender: 'ai',
          text: 'I have successfully updated your architecture diagram! I set up a flow originating from the Start Trigger to the Order Service, which publishes events to the Kafka Topic and persists records to the Database.',
          timestamp: new Date(),
        },
      ]);
      setToast('Diagram updated by AI!');
    } catch (error) {
      console.error('AI chat request failed:', error);
      
      // Add error response from AI
      setMessages((prev) => [
        ...prev,
        {
          id: `msg-${Date.now()}-ai`,
          sender: 'ai',
          text: 'Sorry, I encountered an error while trying to process that modification request.',
          timestamp: new Date(),
        },
      ]);
      setToast('Failed to apply AI changes');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-tr from-indigo-600 to-violet-500 text-white shadow-[0_0_20px_rgba(99,102,241,0.4)] hover:scale-105 active:scale-95 transition-all duration-300 cursor-pointer border border-indigo-400/20"
        title="AI Architecture Helper"
      >
        {isOpen ? <X size={22} /> : <Sparkles size={22} className="animate-pulse" />}
      </button>

      {/* Floating Chat Window Panel */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-96 h-[480px] rounded-2xl bg-slate-950/95 border border-slate-800/80 shadow-[0_10px_50px_rgba(0,0,0,0.5)] backdrop-blur-md flex flex-col overflow-hidden z-40 animate-in fade-in slide-in-from-bottom-5 duration-300">
          
          {/* Header */}
          <div className="px-4 py-3 bg-slate-900 border-b border-slate-800/60 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-indigo-500/10 rounded-lg text-indigo-400">
                <Bot size={16} />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                  Flowery AI Architect
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
                </h3>
                <p className="text-[9px] text-slate-400">Online Helper</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-slate-200 cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>

          {/* Message List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 flex flex-col">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2 max-w-[85%] ${
                  msg.sender === 'user' ? 'self-end flex-row-reverse' : 'self-start'
                }`}
              >
                {msg.sender === 'ai' && (
                  <div className="w-6 h-6 rounded-full bg-indigo-950 border border-indigo-800 flex items-center justify-center text-indigo-400 shrink-0 mt-0.5">
                    <Bot size={12} />
                  </div>
                )}
                {msg.sender === 'user' && (
                  <div className="w-6 h-6 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 shrink-0 mt-0.5">
                    <MessageSquare size={12} />
                  </div>
                )}
                <div
                  className={`px-3 py-2 rounded-2xl text-[11px] leading-normal ${
                    msg.sender === 'user'
                      ? 'bg-indigo-600/25 border border-indigo-500/35 text-indigo-100 rounded-tr-none'
                      : 'bg-slate-900/90 border border-slate-800/80 text-slate-200 rounded-tl-none'
                  }`}
                >
                  <p>{msg.text}</p>
                </div>
              </div>
            ))}

            {/* Pulsing Dots typing indicator */}
            {isLoading && (
              <div className="flex gap-2 max-w-[85%] self-start">
                <div className="w-6 h-6 rounded-full bg-indigo-950 border border-indigo-800 flex items-center justify-center text-indigo-400 shrink-0 mt-0.5">
                  <Bot size={12} />
                </div>
                <div className="flex items-center gap-1 bg-slate-900/90 border border-slate-800/80 rounded-2xl rounded-tl-none px-3.5 py-2.5">
                  <span className="w-1 h-1 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                  <span className="w-1 h-1 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                  <span className="w-1 h-1 bg-indigo-400 rounded-full animate-bounce" />
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Form Input */}
          <form onSubmit={handleSend} className="p-3 border-t border-slate-800/60 bg-slate-950/50 flex items-center gap-2">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Describe modifications (e.g. 'Add AI engine')..."
              className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500/60 transition-all duration-200 placeholder:text-slate-500"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={!inputMessage.trim() || isLoading}
              className="p-2 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-white active:scale-95 transition-all duration-200 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
            >
              <Send size={14} />
            </button>
          </form>
        </div>
      )}

      {/* Local Toast notifications */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 rounded-xl bg-slate-900 border border-slate-800 px-4 py-3 shadow-2xl backdrop-blur-md animate-bounce z-50">
          <Sparkles size={16} className="text-indigo-400" />
          <p className="text-xs font-medium text-slate-200">{toast}</p>
        </div>
      )}
    </>
  );
}
