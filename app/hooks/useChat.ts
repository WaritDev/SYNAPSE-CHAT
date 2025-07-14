import { useState, useEffect } from 'react';
import { Role, Message, ChatSession } from '@/app/lib/types';
import { API_CHAT_ENDPOINT } from '@/app/lib/constants';

export function useChat() {
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
    if (chatHistory.length > 0) {
      try {
        localStorage.setItem('synapseChatHistory', JSON.stringify(chatHistory));
      } catch (error) { console.error("Could not save chat history:", error); }
    } else {
      localStorage.removeItem('synapseChatHistory');
    }
  }, [chatHistory]);

  const startNewChat = (role: Role) => {
    const newSession: ChatSession = {
      sessionId: `${role.replace(/\s+/g, '-')}-${crypto.randomUUID()}`,
      role: role,
      messages: [],
      timestamp: Date.now(),
    };
    setActiveSession(newSession);
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
    const isFirstMessage = activeSession.messages.length === 0;
    const updatedMessages = [...activeSession.messages, userMessage];
    
    setActiveSession(prev => ({ ...prev!, messages: updatedMessages }));
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
      const assistantMessage: Message = { role: 'assistant', content: data.output || "Sorry, a connection could not be established." };
      
      const finalMessages = [...updatedMessages, assistantMessage];
      const finalSession: ChatSession = { ...activeSession, messages: finalMessages, timestamp: Date.now() };

      setActiveSession(finalSession);

      if (isFirstMessage) {
        setChatHistory(prev => [finalSession, ...prev.filter(s => s.sessionId !== finalSession.sessionId)]);
      } else {
        setChatHistory(prev => prev.map(s => s.sessionId === activeSession.sessionId ? finalSession : s).sort((a,b) => b.timestamp - a.timestamp));
      }

    } catch (error) {
      console.error("Failed to send message:", error);
      const errorMessage: Message = { role: 'assistant', content: "A connection error occurred. Please try again." };
      setActiveSession(prev => ({ ...prev!, messages: [...updatedMessages, errorMessage] }));
    } finally {
      setIsLoading(false);
    }
  };

  return {
    activeSession,
    chatHistory,
    isLoading,
    input,
    setInput,
    startNewChat,
    loadChat,
    deleteChat,
    clearAllHistory,
    goHome,
    handleSendMessage,
  };
}