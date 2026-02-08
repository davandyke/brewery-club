'use client'

import { signOut, useSession } from 'next-auth/react'
import { useState } from 'react'
import { LoginModal } from '@/components/LoginModal'

export function LoginButton() {
    const { data: session } = useSession()
    const [isModalOpen, setIsModalOpen] = useState(false)

    if (session) {
        return (
            <div className="flex items-center gap-4">
                {session.user?.image ? (
                    <img
                        src={session.user.image}
                        alt={session.user.name || 'User'}
                        className="w-10 h-10 rounded-full border-2 border-amber-500"
                    />
                ) : (
                    <div className="w-10 h-10 rounded-full border-2 border-amber-500 bg-amber-500 flex items-center justify-center text-neutral-900 font-bold">
                        {session.user?.name?.charAt(0) || 'U'}
                    </div>
                )}
                <div className="flex flex-col text-right">
                    <span className="text-sm font-bold text-white max-w-[150px] truncate">{session.user?.name}</span>
                    <button
                        onClick={() => signOut()}
                        className="text-xs text-neutral-400 hover:text-white transition-colors"
                    >
                        Sign out
                    </button>
                </div>
            </div>
        )
    }

    return (
        <>
            <button
                onClick={() => setIsModalOpen(true)}
                className="bg-white hover:bg-neutral-100 text-neutral-900 px-6 py-2 rounded-full font-bold transition-colors flex items-center gap-2 shadow-md"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path>
                    <polyline points="10 17 15 12 10 7"></polyline>
                    <line x1="15" y1="12" x2="3" y2="12"></line>
                </svg>
                Member Login
            </button>
            <LoginModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
        </>
    )
}
