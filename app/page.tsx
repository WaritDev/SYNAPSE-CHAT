'use client';

import React from 'react';
import { useChat } from '@/app/hooks/useChat';
import RoleSelectionScreen from '@/app/components/RoleSelectionScreen';
import ChatScreen from '@/app/components/ChatScreen';


const CustomCSS = () => (
  <style jsx global>{`
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
    body {
        font-family: 'Inter', sans-serif;
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
  const {
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
  } = useChat();

  return (
    <>
      <CustomCSS />
      <main>
        {!activeSession ? (
          <RoleSelectionScreen 
            onStartNewChat={startNewChat} 
          />
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