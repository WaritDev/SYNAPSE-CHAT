import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ChatSession} from '@/app/lib/types';
import LoadingIndicator from './LoadingIndicator';

const AssistantAvatar = () => (
    <div className="w-8 h-8 flex-shrink-0 rounded-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center shadow-lg">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 3v2.35M12 18.65V21"/>
            <path d="M18.65 12H21M3 12h2.35"/>
            <path d="m16.83 7.17-1.41-1.41M8.59 15.41l-1.41-1.41"/>
            <path d="m7.17 7.17-1.41 1.41M15.41 15.41l1.41 1.41"/>
        </svg>
    </div>
);

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

export default function ChatScreen({ session, chatHistory, input, setInput, isLoading, onSendMessage, onGoHome, onLoadChat, onDeleteChat, onClearAllHistory }: ChatScreenProps) {
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const nonEmptyHistory = chatHistory.filter(s => s.messages.length > 0);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [session.messages]);

    return (
        <div className="relative flex h-screen bg-[#121212] text-white overflow-hidden font-['Inter']">
        <aside className={`absolute md:relative z-20 md:z-auto flex-shrink-0 w-80 bg-[#1E1E1E] border-r border-[#333333] flex flex-col h-full transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
            <div className="flex justify-between items-center p-4 border-b border-[#333333]">
            <h2 className="text-lg font-semibold">Chat History</h2>
            <button onClick={() => setIsSidebarOpen(false)} className="md:hidden p-1 text-gray-400 hover:text-white">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
            </div>
            <div className="flex-grow p-2 overflow-y-auto">
            {nonEmptyHistory.map(s => (
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
                Select New Role
            </button>
            <button onClick={onClearAllHistory} className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-transparent border border-red-800 text-red-400 rounded-lg text-sm hover:bg-red-900/50 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 9l-6-6H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path><line x1="18" y1="12.5" x2="12" y2="12.5"></line><line x1="12" y1="12.5" x2="12" y2="18.5"></line><line x1="12" y1="12.5" x2="6" y2="12.5"></line></svg>
                Clear All History
            </button>
            </div>
        </aside>

        <div className="flex-1 flex flex-col h-screen overflow-hidden">
            <header className="flex justify-between items-center p-3 border-b border-[#333333] flex-shrink-0">
            <button onClick={() => setIsSidebarOpen(true)} className="p-2 md:hidden text-gray-400 hover:text-white">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
            </button>
            <span className="font-semibold md:hidden">{session.role}</span>
            <Image src="/synapse.png" alt="Synapse Logo" width={128} height={32} className="w-32 ml-auto" />
            </header>

            <main className="flex-grow p-4 overflow-y-auto min-h-0">
            <div className="space-y-6">
                {session.messages.map((msg, index) => (
                <div key={index} className={`flex items-start gap-4 message-container ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    {msg.role === 'assistant' && <AssistantAvatar />}
                    
                    {msg.role === 'user' && (
                    <div className="max-w-xl rounded-lg bg-[#E50914] text-white p-3 break-words">
                        {msg.content}
                    </div>
                    )}

                    {msg.role === 'assistant' && (
                    <div className="max-w-xl rounded-lg bg-transparent text-[#E0E0E0] min-w-0">
                        <div className="prose prose-sm prose-invert break-words">
                        <ReactMarkdown 
                            remarkPlugins={[remarkGfm]}
                            components={{
                            table: ({ ...props}) => (
                                <div className="overflow-x-auto rounded-lg border border-[#333333]">
                                <table className="my-0" {...props} />
                                </div>
                            )
                            }}
                        >
                            {msg.content}
                        </ReactMarkdown>
                        </div>
                    </div>
                    )}
                </div>
                ))}
                {isLoading && (
                <div className="flex items-start gap-4">
                    <AssistantAvatar />
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
                <input type="text" value={input} onChange={(e) => setInput(e.target.value)} placeholder={`Chatting as ${session.role}...`} className="w-full bg-transparent focus:outline-none px-2" disabled={isLoading} />
                <button type="submit" className="p-2 bg-[#E50914] rounded-lg disabled:bg-gray-500" disabled={isLoading}>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                </button>
            </form>
            </footer>
        </div>
        </div>
    );
}