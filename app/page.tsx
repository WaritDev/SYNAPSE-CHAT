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
    @keyframes fadeIn {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
    }
    .message-container {
        animation: fadeIn 0.5s ease-out;
    }

    /* Gemini-style Markdown Table */
    .prose table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 1em;
      border-radius: 0.75rem;
      overflow: hidden;
      border: 1px solid #333;
    }
    .prose th, .prose td {
      border: none;
      border-bottom: 1px solid #333;
      padding: 0.75rem 1rem;
      text-align: left;
    }
    .prose thead {
      background-color: #2a2a2a;
    }
    .prose thead th {
      font-weight: 600;
      color: white;
    }
    .prose tbody tr:last-child td {
      border-bottom: none;
    }

    /* Other Prose Styles */
    .prose {
      color: #E0E0E0;
    }
    .prose p {
        margin: 0;
    }
    .prose h1, .prose h2, .prose h3, .prose h4, .prose strong {
      color: white;
      margin-top: 1em;
      margin-bottom: 0.5em;
    }
    .prose a {
      color: #F87171;
    }
    .prose code {
      background-color: #121212;
      padding: 0.2em 0.4em;
      margin: 0 0.1em;
      border-radius: 3px;
      font-size: 85%;
      border: 1px solid #333;
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
        border: none;
    }
    .prose ul, .prose ol {
      padding-left: 1.5em;
      margin-top: 0.5em;
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