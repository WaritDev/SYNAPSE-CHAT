import React from 'react';
import Image from 'next/image';
import { Role } from '@/app/lib/types';
import { Icons, ROLE_DETAILS } from '@/app/lib/constants';

interface RoleSelectionScreenProps { 
    onStartNewChat: (role: Role) => void;
}

export default function RoleSelectionScreen({ onStartNewChat }: RoleSelectionScreenProps) {
    return (
        <div className="flex flex-col justify-center items-center min-h-screen bg-[#121212] text-white p-4 font-['Inter']">
        <Image src="/exxon.png" alt="ExxonMobil Logo" width={64} height={64} className="w-16 absolute top-6 right-6 opacity-50" />
        <div className="w-full max-w-md text-center">
            <Image src="/synapse.png" alt="Synapse Logo" width={192} height={48} className="w-48 mx-auto mb-4" />
            <h2 className="text-3xl font-bold mb-8">Select Your Role</h2>
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