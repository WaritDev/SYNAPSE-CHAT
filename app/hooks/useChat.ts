import { useState, useEffect } from 'react';
import Pusher from 'pusher-js';
import { Role, Message, ChatSession } from '@/app/lib/types';
import { API_CHAT_ENDPOINT, ROLE_DETAILS } from '@/app/lib/constants';

export function useChat() {
  const [activeSession, setActiveSession] = useState<ChatSession | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatSession[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [input, setInput] = useState<string>('');

  useEffect(() => {
    try {
      const savedHistory = localStorage.getItem('synapseChatHistory');
      if (savedHistory) {
        setChatHistory(JSON.parse(savedHistory));
      }
    } catch (error) {
      console.error("Could not load chat history:", error);
    }
  }, []);

  useEffect(() => {
    if (chatHistory.length > 0) {
      localStorage.setItem('synapseChatHistory', JSON.stringify(chatHistory));
    } else {
      localStorage.removeItem('synapseChatHistory');
    }
  }, [chatHistory]);

  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_PUSHER_KEY || !process.env.NEXT_PUBLIC_PUSHER_CLUSTER) {
        console.error("Pusher environment variables are not set.");
        return;
    }

    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
    });

    const channels = (Object.keys(ROLE_DETAILS) as Role[]).map(role => {
        const channelName = `chat-notifications-${role}`;
        const channel = pusher.subscribe(channelName);
        
        channel.bind('new-alert', (data: { content: string }) => {
            const notificationMessage: Message = {
                role: 'assistant',
                content: `🔔 **Alert:** ${data.content}`
            };

            setChatHistory(prevHist => {
                let sessionUpdated = false;
                const updatedHistory = prevHist.map(session => {
                    if (session.role === role) {
                        sessionUpdated = true;
                        return { ...session, messages: [...session.messages, notificationMessage], timestamp: Date.now() };
                    }
                    return session;
                });

                if (!sessionUpdated) {
                    const newSession: ChatSession = {
                        sessionId: role,
                        role: role,
                        messages: [notificationMessage],
                        timestamp: Date.now(),
                    };
                    return [newSession, ...updatedHistory];
                }
                
                return updatedHistory.sort((a, b) => b.timestamp - a.timestamp);
            });
        });
        return channel;
    });

    return () => {
        channels.forEach(channel => pusher.unsubscribe(channel.name));
        pusher.disconnect();
    };
  }, []);

  const startNewChat = (role: Role) => {
    const existingSession = chatHistory.find(session => session.role === role);

    if (existingSession) {
      setActiveSession(existingSession);
    } else {
      const newSession: ChatSession = {
        sessionId: role,
        role: role,
        messages: [
          { role: 'assistant', content: `Hello! I'm your AI assistant for the **${role}** role. How can I help you today?` }
        ],
        timestamp: Date.now(),
      };
      setChatHistory(prev => [newSession, ...prev].sort((a, b) => b.timestamp - a.timestamp));
      setActiveSession(newSession);
    }
  };

  const loadChat = (session: ChatSession) => setActiveSession(session);
  
  const deleteChat = (sessionIdToDelete: string) => {
    setChatHistory(prev => prev.filter(s => s.sessionId !== sessionIdToDelete));
    if (activeSession?.sessionId === sessionIdToDelete) {
      setActiveSession(null);
    }
  };
  
  const clearAllHistory = () => {
    if (window.confirm("Are you sure you want to delete all chat history? This action cannot be undone.")) {
        setChatHistory([]);
        setActiveSession(null);
    }
  };

  const goHome = () => setActiveSession(null);

  const handleSendMessage = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim() || isLoading || !activeSession) return;

    const userMessage: Message = { role: 'user', content: input };
    const updatedMessages = [...activeSession.messages, userMessage];
    
    const updatedSession: ChatSession = { ...activeSession, messages: updatedMessages, timestamp: Date.now() };
    setActiveSession(updatedSession);

    setChatHistory(prev => 
        prev.map(s => s.sessionId === activeSession.sessionId ? updatedSession : s)
            .sort((a, b) => b.timestamp - a.timestamp)
    );

    setInput('');

    if (input.trim() === "Start Q2 2025 inventory planning") {
      const inventoryPlanningResponse = `![Inventory Dashboard](/public/dashboard.png)

**Q2 2025 Inventory Planning Scenarios**

**Scenario A: Max Stock Ahead**
"Build up stock by 15% ahead of peak demand in December to avoid last-minute shortages."

**Pros:** Ensures availability during peak season
**Cons:** Risk of warehouse overflow, higher holding cost

**Scenario B: Balanced Flow**
"Maintain current inbound pace, but accelerate outbound by pushing sales in November to clear space."

**Pros:** Avoids overflow and reduces scrap risk
**Cons:** Requires strong coordination with Sales

**Scenario C: Agile Just-in-Time**
"Delay non-priority inbound items by 2–3 weeks and allocate WH space dynamically by demand pattern."

**Pros:** Flexible and cost-effective
**Cons:** Higher risk of stockouts, requires precise demand forecasting`;

      const assistantMessage: Message = { role: 'assistant', content: inventoryPlanningResponse };
      const finalSession: ChatSession = { 
        ...activeSession, 
        messages: [...updatedMessages, assistantMessage], 
        timestamp: Date.now() 
      };

      setActiveSession(finalSession);
      setChatHistory(prev => 
        prev.map(s => s.sessionId === activeSession.sessionId ? finalSession : s)
            .sort((a,b) => b.timestamp - a.timestamp)
      );
      return;
    }

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
      
      const finalSession: ChatSession = { ...activeSession, messages: [...updatedMessages, assistantMessage], timestamp: Date.now() };

      setActiveSession(finalSession);
      setChatHistory(prev => 
        prev.map(s => s.sessionId === activeSession.sessionId ? finalSession : s)
            .sort((a,b) => b.timestamp - a.timestamp)
      );

    } catch (error) {
      console.error("Failed to send message:", error);
      const errorMessage: Message = { role: 'assistant', content: "A connection error occurred. Please try again." };
      const errorSession = { ...activeSession, messages: [...updatedMessages, errorMessage], timestamp: Date.now() };
      
      setActiveSession(errorSession);
      setChatHistory(prev => 
        prev.map(s => s.sessionId === activeSession.sessionId ? errorSession : s)
            .sort((a,b) => b.timestamp - a.timestamp)
      );
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