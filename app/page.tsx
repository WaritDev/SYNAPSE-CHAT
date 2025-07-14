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

    /* Basic Markdown Styles for Dark Theme */
    .prose {
      color: #E0E0E0; /* --text-color */
    }
    .prose h1, .prose h2, .prose h3, .prose h4, .prose strong {
      color: white;
    }
    .prose a {
      color: #F87171; /* A lighter red for links */
    }
    .prose code {
      background-color: #333;
      padding: 0.2em 0.4em;
      margin: 0 0.1em;
      border-radius: 3px;
      font-size: 85%;
    }
    .prose pre {
      background-color: #2a2a2a;
      padding: 1em;
      border-radius: 5px;
      overflow-x: auto;
    }
    .prose pre code {
        background-color: transparent;
        padding: 0;
        margin: 0;
    }
    .prose ul, .prose ol {
      padding-left: 1.5em;
    }
    .prose li > p {
        margin: 0;
    }
    .prose table {
      width: 100%;
      border-collapse: collapse;
    }
    .prose th, .prose td {
      border: 1px solid #444;
      padding: 0.5em 1em;
    }
    .prose th {
      background-color: #333;
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