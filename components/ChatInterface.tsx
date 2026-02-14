import React, { useRef, useEffect, useState } from 'react';
import { Message, User } from '../types';

interface ChatInterfaceProps {
  messages: Message[];
  onSend: (text: string) => void;
  isGenerating: boolean;
  user: User | null;
  onDeleteMessage?: (id: string) => void;
  onRegenerate?: () => void;
  onNavigate?: (page: string) => void;
  isAiReady?: boolean;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ 
  messages, onSend, isGenerating, user, onDeleteMessage, onRegenerate, onNavigate, isAiReady 
}) => {
  const [inputText, setInputText] = useState('');
  const [copyStatus, setCopyStatus] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isGenerating]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputText.trim() && !isGenerating && isAiReady) {
      onSend(inputText);
      setInputText('');
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopyStatus(id);
    setTimeout(() => setCopyStatus(null), 2000);
  };

  const handleRunApp = (content: string) => {
    let finalCode = content;
    const codeBlockRegex = /```(?:html)?([\s\S]*?)```/gi;
    const match = codeBlockRegex.exec(content);
    if (match && match[1]) {
      finalCode = match[1].trim();
    }

    const win = window.open('', '_blank');
    if (win) {
      win.document.write(finalCode);
      win.document.close();
    } else {
      alert("Popup blocker active! Please allow popups to run the app.");
    }
  };

  const handleFileUploadClick = () => {
    if (!user?.premium) {
      if (confirm("File upload sirf Premium users ke liye hai. Kya aap Premium plan dekhna chahenge?")) {
        if (onNavigate) onNavigate('premium');
      }
      return;
    }
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        setInputText(prev => prev + `\n\n[FILE: ${file.name}]\n${content}\n[END FILE]`);
      };
      reader.readAsText(file);
    }
  };

  const hasHtmlContent = (content: string) => {
    const lower = content.toLowerCase();
    return lower.includes('<html') || lower.includes('<!doctype') || lower.includes('<body') || lower.includes('<script') || lower.includes('```html');
  };

  return (
    <div className="flex flex-col h-full bg-[var(--bg-primary)] relative">
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar pb-10">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center opacity-20 text-center px-10">
            <i className="fas fa-robot text-6xl mb-6 text-[var(--accent)]"></i>
            <h2 className="text-xl font-black uppercase tracking-tighter mb-2">Neural Workspace Active</h2>
            <p className="text-[10px] font-black uppercase tracking-widest leading-relaxed">System ready for modern app & game architectural prompts.</p>
          </div>
        )}
        {messages.map((msg, index) => (
          <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
            <div className={`max-w-[90%] p-5 rounded-[1.5rem] text-sm shadow-sm ${msg.role === 'user' ? 'bg-[var(--accent)] text-black rounded-tr-none font-bold' : 'bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-primary)] rounded-tl-none whitespace-pre-wrap'}`}>
              {msg.content}
            </div>

            {msg.role === 'ai' && (
              <div className="flex flex-wrap items-center gap-2 mt-2 ml-1">
                {hasHtmlContent(msg.content) && !isGenerating && (
                  <button onClick={() => handleRunApp(msg.content)} className="text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 py-2 px-4 rounded-full border border-[var(--success)] bg-[var(--success)]/10 text-[var(--success)] hover:bg-[var(--success)] hover:text-black transition-all shadow-lg active:scale-95">
                    <i className="fas fa-play"></i> Run
                  </button>
                )}
                
                <button onClick={() => handleCopy(msg.content, msg.id)} className={`text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 py-2 px-4 rounded-full border border-[var(--border)] bg-[var(--bg-secondary)] transition-all ${copyStatus === msg.id ? 'text-[var(--success)] border-[var(--success)]' : 'text-[var(--text-secondary)] hover:text-[var(--accent)]'}`}>
                  <i className={`fas ${copyStatus === msg.id ? 'fa-check' : 'fa-copy'}`}></i> {copyStatus === msg.id ? 'Copied' : 'Copy'}
                </button>
                
                {onRegenerate && index === messages.length - 1 && !isGenerating && (
                  <button onClick={onRegenerate} className="text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 py-2 px-4 rounded-full bg-[var(--bg-secondary)] text-[var(--text-secondary)] border border-[var(--border)] hover:text-[var(--accent)] transition-all">
                    <i className="fas fa-sync-alt"></i> Recreate
                  </button>
                )}
                
                {onDeleteMessage && !isGenerating && (
                  <button onClick={() => onDeleteMessage(msg.id)} className="text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 py-2 px-4 rounded-full bg-[var(--bg-secondary)] text-[var(--text-secondary)] border border-[var(--border)] hover:text-[var(--danger)] transition-all">
                    <i className="fas fa-trash-alt"></i> Delete
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
        {isGenerating && (
          <div className="flex flex-col items-start">
            <div className="bg-[var(--bg-card)] border border-[var(--border)] p-5 rounded-2xl rounded-tl-none flex flex-col items-center min-w-[140px] shadow-xl">
              <span className="text-[11px] font-black text-[var(--accent)] uppercase tracking-widest mb-3">AI Thinking</span>
              <div className="flex gap-2">
                <div className="w-2 h-2 bg-[var(--accent)] rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-[var(--accent)] rounded-full animate-bounce [animation-delay:0.2s]"></div>
                <div className="w-2 h-2 bg-[var(--accent)] rounded-full animate-bounce [animation-delay:0.4s]"></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 bg-[var(--bg-secondary)] border-t border-[var(--border)]">
        <form onSubmit={handleSubmit} className="flex gap-2 items-center w-full">
          <input 
            type="file" 
            className="hidden" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept=".html,.css,.js,.txt,.json"
          />
          
          <input 
            type="text" 
            placeholder={!isAiReady ? "Initializing AI Engine..." : isGenerating ? "AI is processing..." : "Describe your idea..."} 
            className="flex-1 min-w-0 bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-primary)] rounded-2xl px-5 py-3 text-sm focus:border-[var(--accent)] outline-none font-medium h-12 disabled:opacity-50" 
            value={inputText} 
            onChange={(e) => setInputText(e.target.value)} 
            disabled={isGenerating || !isAiReady} 
          />

          <div className="flex gap-2 shrink-0 pr-1">
            <button 
              type="button"
              onClick={handleFileUploadClick}
              disabled={!isAiReady}
              className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all active:scale-90 shadow-xl relative border ${user?.premium ? 'bg-[var(--bg-primary)] border-[var(--border)] text-[var(--accent)]' : 'bg-gray-800/30 border-transparent text-gray-500'}`}
            >
              <i className="fas fa-paperclip text-base"></i>
              {!user?.premium && (
                <div className="absolute -top-1 -right-1 bg-yellow-500 text-[6px] px-1 rounded-full text-black font-black">PRO</div>
              )}
            </button>
            
            <button 
              type="submit" 
              disabled={!inputText.trim() || isGenerating || !isAiReady} 
              className="w-12 h-12 bg-[var(--button-bg)] text-black rounded-2xl flex items-center justify-center transition-all active:scale-90 disabled:opacity-50 shadow-xl shadow-[var(--accent)]/20"
            >
              {isGenerating ? <i className="fas fa-circle-notch fa-spin text-base"></i> : <i className="fas fa-paper-plane text-base"></i>}
            </button>
          </div>
        </form>
        <div className="flex justify-between items-center mt-3 px-2">
          <p className="text-[9px] text-[var(--text-secondary)] uppercase tracking-widest font-black opacity-50">
            {!isAiReady ? '⏳ System Connecting...' : user?.premium ? '💎 PRO SYSTEM ONLINE' : '⚡ FREE DEVELOPER'}
          </p>
          {!user?.premium && <p className="text-[9px] font-black text-yellow-500 uppercase tracking-widest"><i className="fas fa-clock mr-1"></i> {Math.floor((user?.remaining_ai_seconds || 0) / 60)}m Left</p>}
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;