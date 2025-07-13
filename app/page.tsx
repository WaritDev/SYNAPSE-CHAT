'use client';

import React, { useState, useEffect, useRef, JSX } from 'react';
import Image from 'next/image';

type Role = "Inventory Planner" | "Replenisher" | "Sales" | "Warehouse Operator";

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatSession {
  sessionId: string;
  role: Role;
  messages: Message[];
  timestamp: number;
}

const API_CHAT_ENDPOINT = "/api/chat";

const Icons: { [key in Role]: () => JSX.Element } = {
  "Inventory Planner": () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>,
  "Replenisher": () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 2v6h6"/><path d="M21 12A9 9 0 0 0 6 5.3L3 8"/><path d="M21 22v-6h-6"/><path d="M3 12a9 9 0 0 0 15 6.7l3-2.7"/></svg>,
  "Sales": () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1v22"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
  "Warehouse Operator": () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>,
};

const ROLE_DETAILS: { [key in Role]: { description: string } } = {
    "Inventory Planner": { description: "วิเคราะห์ข้อมูลเพื่อวางแผนและจัดการสต็อกสินค้า" },
    "Replenisher": { description: "เติมสินค้าและรักษาระดับสต็อกให้เหมาะสม" },
    "Sales": { description: "สร้างยอดขายและรักษาความสัมพันธ์กับลูกค้า" },
    "Warehouse Operator": { description: "บริหารจัดการสินค้าในคลังและดูแลการปฏิบัติงาน" },
};

const CustomCSS = () => (
  <style jsx global>{`
    @import url('https://fonts.googleapis.com/css2?family=Prompt:wght@400;600;700&display=swap');
    body {
        font-family: 'Prompt', sans-serif;
    }
    @keyframes audio-wave {
      0% { transform: scaleY(0.3); }
      30% { transform: scaleY(1.0); }
      60% { transform: scaleY(0.5); }
      100% { transform: scaleY(0.3); }
    }
    .audio-wave-bar {
      animation: audio-wave 1.3s infinite ease-in-out;
    }
  `}</style>
);

export default function App() {
  const [activeSession, setActiveSession] = useState<ChatSession | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatSession[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [input, setInput] = useState<string>('');

  useEffect(() => {
    try {
      const savedHistory = localStorage.getItem('synapseChatHistory');
      if (savedHistory) setChatHistory(JSON.parse(savedHistory));
    } catch (error) { console.error("Could not load chat history:", error); }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('synapseChatHistory', JSON.stringify(chatHistory));
    } catch (error) { console.error("Could not save chat history:", error); }
  }, [chatHistory]);

  const startNewChat = (role: Role) => {
    const newSession: ChatSession = {
      sessionId: `${role.replace(/\s+/g, '-')}-${crypto.randomUUID()}`,
      role: role,
      messages: [],
      timestamp: Date.now(),
    };
    setActiveSession(newSession);
    setChatHistory(prev => [newSession, ...prev]);
  };

  const loadChat = (session: ChatSession) => setActiveSession(session);
  
  const deleteChat = (sessionIdToDelete: string) => {
    setChatHistory(prev => prev.filter(s => s.sessionId !== sessionIdToDelete));
    if (activeSession?.sessionId === sessionIdToDelete) setActiveSession(null);
  };
  
  const clearAllHistory = () => {
    setChatHistory([]);
    setActiveSession(null);
  };

  const goHome = () => setActiveSession(null);

  const handleSendMessage = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim() || isLoading || !activeSession) return;

    const userMessage: Message = { role: 'user', content: input };
    const updatedMessages = [...activeSession.messages, userMessage];
    const updatedSession = { ...activeSession, messages: updatedMessages, timestamp: Date.now() };
    
    setActiveSession(updatedSession);
    setChatHistory(prev => prev.map(s => s.sessionId === activeSession.sessionId ? updatedSession : s).sort((a, b) => b.timestamp - a.timestamp));
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch(API_CHAT_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: activeSession.sessionId, chatInput: input, role: activeSession.role })
      });
      if (!response.ok) throw new Error(`API call failed with status: ${response.status}`);
      const data = await response.json();
      const assistantMessage: Message = { role: 'assistant', content: data.output || "ขออภัยค่ะ ไม่สามารถเชื่อมต่อได้" };
      const finalMessages = [...updatedMessages, assistantMessage];
      const finalSession = { ...updatedSession, messages: finalMessages };
      setActiveSession(finalSession);
      setChatHistory(prev => prev.map(s => s.sessionId === activeSession.sessionId ? finalSession : s));
    } catch (error) {
      console.error("Failed to send message:", error);
      const errorMessage: Message = { role: 'assistant', content: "เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่อีกครั้ง" };
      const errorMessages = [...updatedMessages, errorMessage];
      const errorSession = { ...updatedSession, messages: errorMessages };
      setActiveSession(errorSession);
      setChatHistory(prev => prev.map(s => s.sessionId === activeSession.sessionId ? errorSession : s));
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <>
      <CustomCSS />
      <main>
        {!activeSession ? (
          <RoleSelectionScreen onStartNewChat={startNewChat} />
        ) : (
          <ChatScreen 
            session={activeSession}
            chatHistory={chatHistory}
            input={input}
            setInput={setInput}
            isLoading={isLoading}
            onSendMessage={handleSendMessage}
            onGoHome={goHome}
            onLoadChat={loadChat}
            onDeleteChat={deleteChat}
            onClearAllHistory={clearAllHistory}
          />
        )}
      </main>
    </>
  );
}

interface RoleSelectionScreenProps { onStartNewChat: (role: Role) => void; }
function RoleSelectionScreen({ onStartNewChat }: RoleSelectionScreenProps) {
  return (
    <div className="flex flex-col justify-center items-center min-h-screen bg-[#121212] text-white p-4">
      <Image src="/exxon.png" alt="ExxonMobil Logo" width={64} height={64} className="w-16 absolute top-6 right-6 opacity-50" />
      <div className="w-full max-w-md text-center">
        <Image src="/synapse.png" alt="Synapse Logo" width={192} height={48} className="w-48 mx-auto mb-4" />
        <h2 className="text-3xl font-bold mb-8">เลือกบทบาทของคุณ</h2>
        <div className="space-y-6">
          {(Object.keys(ROLE_DETAILS) as Role[]).map((role) => {
            const Icon = Icons[role];
            return (
              <button key={role} onClick={() => onStartNewChat(role)} className="w-full text-left flex items-center p-4 bg-[#1E1E1E] border border-[#333333] rounded-2xl hover:border-[#E50914] hover:scale-105 hover:shadow-[0_0_20px_rgba(229,9,20,0.3)] transition-all duration-300">
                <div className="flex-shrink-0 w-16 h-16 flex items-center justify-center bg-[rgba(229,9,20,0.1)] text-[#E50914] rounded-xl mr-4">
                  <Icon />
                </div>
                <div>
                  <p className="font-semibold text-lg text-[#E0E0E0]">{role}</p>
                  <p className="text-sm text-[#888888]">{ROLE_DETAILS[role].description}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

interface ChatScreenProps {
  session: ChatSession;
  chatHistory: ChatSession[];
  input: string;
  setInput: React.Dispatch<React.SetStateAction<string>>;
  isLoading: boolean;
  onSendMessage: (e: React.FormEvent<HTMLFormElement>) => void;
  onGoHome: () => void;
  onLoadChat: (session: ChatSession) => void;
  onDeleteChat: (sessionId: string) => void;
  onClearAllHistory: () => void;
}

function LoadingIndicator() {
    return (
        <div className="flex items-center justify-center space-x-1.5 h-8">
            <span className="audio-wave-bar w-1.5 h-full bg-red-500 rounded-full" style={{ animationDelay: '0s' }}></span>
            <span className="audio-wave-bar w-1.5 h-full bg-red-500 rounded-full" style={{ animationDelay: '0.15s' }}></span>
            <span className="audio-wave-bar w-1.5 h-full bg-red-500 rounded-full" style={{ animationDelay: '0.3s' }}></span>
            <span className="audio-wave-bar w-1.5 h-full bg-red-500 rounded-full" style={{ animationDelay: '0.45s' }}></span>
            <span className="audio-wave-bar w-1.5 h-full bg-red-500 rounded-full" style={{ animationDelay: '0.6s' }}></span>
        </div>
    );
}

function ChatScreen({ session, chatHistory, input, setInput, isLoading, onSendMessage, onGoHome, onLoadChat, onDeleteChat, onClearAllHistory }: ChatScreenProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [session.messages]);

  return (
    <div className="relative flex h-screen bg-[#121212] text-white overflow-hidden">
      <aside className={`absolute md:relative z-20 md:z-auto flex-shrink-0 w-80 bg-[#1E1E1E] border-r border-[#333333] flex flex-col h-full transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="flex justify-between items-center p-4 border-b border-[#333333]">
          <h2 className="text-lg font-semibold">ประวัติการสนทนา</h2>
          <button onClick={() => setIsSidebarOpen(false)} className="md:hidden p-1 text-gray-400 hover:text-white">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>
        <div className="flex-grow p-2 overflow-y-auto">
          {chatHistory.map(s => (
            <div key={s.sessionId} className={`group relative p-3 rounded-lg cursor-pointer transition-colors ${session.sessionId === s.sessionId ? 'bg-[#E50914]' : 'hover:bg-[#2a2a2a]'}`} onClick={() => { onLoadChat(s); setIsSidebarOpen(false); }}>
              <button onClick={(e) => { e.stopPropagation(); onDeleteChat(s.sessionId); }} className="absolute top-2 right-2 p-1 text-gray-500 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
              </button>
              <p className="font-semibold text-sm truncate">{s.role}</p>
              <p className="text-xs text-gray-400 truncate">{s.messages[0]?.content || 'New Chat'}</p>
            </div>
          ))}
        </div>
        <div className="p-4 border-t border-[#333333] space-y-2">
          <button onClick={onGoHome} className="w-full px-4 py-2 bg-[#121212] border border-[#333333] rounded-lg text-sm hover:bg-[#2a2a2a] transition-colors">
            เลือกบทบาทใหม่
          </button>
          <button onClick={onClearAllHistory} className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-transparent border border-red-800 text-red-400 rounded-lg text-sm hover:bg-red-900/50 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 9l-6-6H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path><line x1="18" y1="12.5" x2="12" y2="12.5"></line><line x1="12" y1="12.5" x2="12" y2="18.5"></line><line x1="12" y1="12.5" x2="6" y2="12.5"></line></svg>
            ล้างประวัติทั้งหมด
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col h-full">
        <header className="flex justify-between items-center p-3 border-b border-[#333333] flex-shrink-0">
          <button onClick={() => setIsSidebarOpen(true)} className="p-2 md:hidden text-gray-400 hover:text-white">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
          </button>
          <span className="font-semibold md:hidden">{session.role}</span>
          <Image src="/synapse.png" alt="Synapse Logo" width={128} height={32} className="w-32 ml-auto" />
        </header>

        <main className="flex-grow p-4 overflow-y-auto">
          <div className="space-y-4">
            {session.messages.map((msg, index) => (
              <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-xl p-3 rounded-lg ${msg.role === 'user' ? 'bg-[#E50914] text-white' : 'bg-[#1E1E1E] text-[#E0E0E0]'}`}>
                  {msg.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="p-3 rounded-lg bg-[#1E1E1E] text-[#E0E0E0]">
                  <LoadingIndicator />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </main>

        <footer className="p-4 flex-shrink-0">
          <form onSubmit={onSendMessage} className="flex items-center bg-[#1E1E1E] border border-[#333333] rounded-xl p-2">
            <input type="text" value={input} onChange={(e) => setInput(e.target.value)} placeholder={`คุยในฐานะ ${session.role}...`} className="w-full bg-transparent focus:outline-none px-2" disabled={isLoading} />
            <button type="submit" className="p-2 bg-[#E50914] rounded-lg disabled:bg-gray-500" disabled={isLoading}>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
            </button>
          </form>
        </footer>
      </div>
    </div>
  );
}