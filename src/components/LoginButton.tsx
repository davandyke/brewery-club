'use client'

import { signIn, signOut, useSession } from 'next-auth/react'

export function LoginButton() {
    const { data: session } = useSession()

    if (session) {
        return (
            <div className="flex items-center gap-4">
                {session.user?.image && (
                    <img
                        src={session.user.image}
                        alt={session.user.name || 'User'}
                        className="w-10 h-10 rounded-full border-2 border-amber-500"
                    />
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
        <button
            onClick={() => signIn('facebook')}
            className="bg-[#1877F2] hover:bg-[#166fe5] text-white px-6 py-2 rounded-full font-bold transition-colors flex items-center gap-2"
        >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                <path d="M16 8.049c0-4.446-3.582-8.05-8-8.05C3.58 0-.002 3.603-.002 8.05c0 4.017 2.926 7.347 6.75 7.951v-5.625h-2.03V8.05H6.75V6.275c0-2.017 1.195-3.131 3.022-3.131.876 0 1.791.157 1.791.157v1.98h-1.009c-.993 0-1.303.621-1.303 1.258v1.51h2.218l-.354 2.326H9.25V16c3.824-.604 6.75-3.934 6.75-7.951" />
            </svg>
            Login with Facebook
        </button>
    )
}
