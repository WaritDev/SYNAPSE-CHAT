import React from 'react';

export default function LoadingIndicator() {
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