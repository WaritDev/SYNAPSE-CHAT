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

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (isSidebarOpen && window.innerWidth < 768) {
                const sidebar = document.getElementById('sidebar');
                if (sidebar && !sidebar.contains(event.target as Node)) {
                    setIsSidebarOpen(false);
                }
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isSidebarOpen]);

    return (
        <div className="relative flex h-[100dvh] bg-[#121212] text-white overflow-hidden font-['Inter']">
            {isSidebarOpen && (
                <div 
                    className="fixed inset-0 bg-black bg-opacity-50 z-10 md:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            <aside 
                id="sidebar"
                className={`fixed md:relative z-20 md:z-auto flex-shrink-0 w-80 max-w-[85vw] bg-[#1E1E1E] border-r border-[#333333] flex flex-col h-full transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
            >
                <div className="flex justify-between items-center p-4 border-b border-[#333333]">
                    <h2 className="text-lg font-semibold">Chat History</h2>
                    <button 
                        onClick={() => setIsSidebarOpen(false)} 
                        className="md:hidden p-1 text-gray-400 hover:text-white"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>
                
                <div className="flex-grow p-2 overflow-y-auto">
                    {nonEmptyHistory.map(s => (
                        <div 
                            key={s.sessionId} 
                            className={`group relative p-3 rounded-lg cursor-pointer transition-colors ${session.sessionId === s.sessionId ? 'bg-[#E50914]' : 'hover:bg-[#2a2a2a]'}`} 
                            onClick={() => { onLoadChat(s); setIsSidebarOpen(false); }}
                        >
                            <button 
                                onClick={(e) => { e.stopPropagation(); onDeleteChat(s.sessionId); }} 
                                className="absolute top-2 right-2 p-1 text-gray-500 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="3 6 5 6 21 6"></polyline>
                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                </svg>
                            </button>
                            <p className="font-semibold text-sm truncate pr-6">{s.role}</p>
                            <p className="text-xs text-gray-400 truncate pr-6">{s.messages[0]?.content || 'New Chat'}</p>
                        </div>
                    ))}
                </div>
                
                <div className="p-4 border-t border-[#333333] space-y-2">
                    <button 
                        onClick={onGoHome} 
                        className="w-full px-4 py-2 bg-[#121212] border border-[#333333] rounded-lg text-sm hover:bg-[#2a2a2a] transition-colors"
                    >
                        Select New Role
                    </button>
                    <button 
                        onClick={onClearAllHistory} 
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-transparent border border-red-800 text-red-400 rounded-lg text-sm hover:bg-red-900/50 transition-colors"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 9l-6-6H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>
                            <line x1="18" y1="12.5" x2="12" y2="12.5"></line>
                            <line x1="12" y1="12.5" x2="12" y2="18.5"></line>
                            <line x1="12" y1="12.5" x2="6" y2="12.5"></line>
                        </svg>
                        Clear All History
                    </button>
                </div>
            </aside>

            <div className="flex-1 flex flex-col h-full min-h-0 overflow-hidden">
                <header className="flex justify-between items-center p-3 border-b border-[#333333] flex-shrink-0">
                    <button 
                        onClick={() => setIsSidebarOpen(true)} 
                        className="p-2 md:hidden text-gray-400 hover:text-white"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="3" y1="12" x2="21" y2="12"></line>
                            <line x1="3" y1="6" x2="21" y2="6"></line>
                            <line x1="3" y1="18" x2="21" y2="18"></line>
                        </svg>
                    </button>
                    <span className="font-semibold md:hidden text-sm truncate mx-2 flex-1">{session.role}</span>
                    <Image 
                        src="/synapse.png" 
                        alt="Synapse Logo" 
                        width={128} 
                        height={32} 
                        className="w-24 md:w-32 ml-auto flex-shrink-0" 
                    />
                </header>

                <main className="flex-grow p-3 md:p-4 overflow-y-auto">
                    <div className="space-y-4 md:space-y-6">
                        {session.messages.map((msg, index) => (
                            <div key={index} className={`flex items-start gap-3 md:gap-4 message-container ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                {msg.role === 'assistant' && <AssistantAvatar />}
                                
                                {msg.role === 'user' && (
                                    <div className="max-w-[85%] md:max-w-xl rounded-lg bg-[#E50914] text-white p-3 break-words">
                                        {msg.content}
                                    </div>
                                )}

                                {msg.role === 'assistant' && (
                                    <div className="max-w-[85%] md:max-w-4xl rounded-lg bg-transparent text-[#E8E8E8] min-w-0">
                                        <div className="break-words max-w-none text-[#E8E8E8]">
                                            <ReactMarkdown 
                                                remarkPlugins={[remarkGfm]}
                                                components={{
                                                    h1: ({ ...props }) => <h1 className="text-2xl md:text-3xl font-bold mb-6 mt-8 first:mt-0 text-white border-b border-[#333333] pb-3" {...props} />,
                                                    h2: ({ ...props }) => <h2 className="text-xl md:text-2xl font-semibold mb-4 mt-8 first:mt-0 text-white" {...props} />,
                                                    h3: ({ ...props }) => <h3 className="text-lg md:text-xl font-medium mb-3 mt-6 first:mt-0 text-white" {...props} />,
                                                    h4: ({ ...props }) => <h4 className="text-base md:text-lg font-medium mb-2 mt-5 first:mt-0 text-white" {...props} />,
                                                    p: ({ ...props }) => <p className="mb-6 leading-[1.7] text-[#E8E8E8] text-base md:text-lg first:mt-0" {...props} />,
                                                    ul: ({ ...props }) => <ul className="mb-6 mt-4 space-y-2 pl-0 list-none [&>li]:relative [&>li]:pl-6 [&>li]:before:content-['•'] [&>li]:before:absolute [&>li]:before:left-0 [&>li]:before:text-[#E50914] [&>li]:before:font-bold [&>li]:before:text-lg" {...props} />,
                                                    ol: ({ ...props }) => <ol className="mb-6 mt-4 space-y-2 list-decimal pl-6 marker:text-[#E50914] marker:font-semibold" {...props} />,
                                                    li: ({ ...props }) => <li className="text-[#E8E8E8] leading-[1.7] text-base md:text-lg mb-2 last:mb-0" {...props} />,
                                                    pre: ({ ...props }) => <div className="my-6 rounded-lg bg-[#1A1A1A] border border-[#333333] overflow-hidden"><pre className="p-4 overflow-x-auto text-sm md:text-base leading-[1.5] text-[#F8F8F2] m-0" {...props} /></div>,
                                                    code: ({ ...props }) => <code className="bg-[#2A2A2A] text-[#F8F8F2] px-1.5 py-0.5 rounded text-sm md:text-base font-mono" {...props} />,
                                                    table: ({ ...props }) => <div className="my-6 overflow-x-auto rounded-lg border border-[#333333]"><table className="min-w-full text-sm md:text-base" {...props} /></div>,
                                                    thead: ({ ...props }) => <thead className="bg-[#1A1A1A]" {...props} />,
                                                    th: ({ ...props }) => <th className="px-4 py-3 text-left font-semibold text-white border-b border-[#333333]" {...props} />,
                                                    td: ({ ...props }) => <td className="px-4 py-3 border-b border-[#333333] text-[#E8E8E8] leading-[1.6]" {...props} />,
                                                    blockquote: ({ ...props }) => <blockquote className="my-6 pl-6 border-l-4 border-[#E50914] bg-[#1A1A1A] py-4 rounded-r-lg italic text-[#D0D0D0]" {...props} />,
                                                    a: ({ ...props }) => <a className="text-[#E50914] hover:text-[#FF1A2E] underline underline-offset-2 transition-colors" {...props} />,
                                                    strong: ({ ...props }) => <strong className="font-semibold text-white" {...props} />,
                                                    em: ({ ...props }) => <em className="italic text-[#F0F0F0]" {...props} />,
                                                    hr: ({ ...props }) => <hr className="my-8 border-[#333333] border-t-2" {...props} />,
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
                            <div className="flex items-start gap-3 md:gap-4">
                                <AssistantAvatar />
                                <div className="p-3 rounded-lg bg-[#1E1E1E] text-[#E0E0E0]">
                                    <LoadingIndicator />
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                </main>

                <footer className="p-3 md:p-4 flex-shrink-0 pb-[env(safe-area-inset-bottom)]">
                    <form onSubmit={onSendMessage} className="flex items-center bg-[#1E1E1E] border border-[#333333] rounded-xl p-2">
                        <input 
                            type="text" 
                            value={input} 
                            onChange={(e) => setInput(e.target.value)} 
                            placeholder={`Chatting as ${session.role}...`} 
                            className="w-full bg-transparent focus:outline-none px-2 text-base" 
                            disabled={isLoading} 
                        />
                        <button 
                            type="submit" 
                            className="p-2 bg-[#E50914] rounded-lg disabled:bg-gray-500 flex-shrink-0" 
                            disabled={isLoading}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="22" y1="2" x2="11" y2="13"></line>
                                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                            </svg>
                        </button>
                    </form>
                </footer>
            </div>
        </div>
    );
}
