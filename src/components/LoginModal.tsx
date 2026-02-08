'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'

interface LoginModalProps {
    isOpen: boolean
    onClose: () => void
}

export function LoginModal({ isOpen, onClose }: LoginModalProps) {
    const [name, setName] = useState('')
    const [code, setCode] = useState('')
    const [email, setEmail] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [mode, setMode] = useState<'code' | 'magic'>('code')

    if (!isOpen) return null

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)

        try {
            if (mode === 'code') {
                const result = await signIn('credentials', {
                    name,
                    code,
                    redirect: false,
                })

                if (result?.error) {
                    alert('Invalid name or code')
                } else {
                    onClose()
                    window.location.reload()
                }
            } else {
                const result = await signIn('email', {
                    email,
                    redirect: false,
                })
                if (result?.error) {
                    alert('Error sending magic link')
                } else {
                    alert('Check your email for the magic link!')
                    onClose()
                }
            }
        } catch (error) {
            console.error(error)
            alert('An error occurred')
        } finally {
            setIsLoading(false)
        }
    }


    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-neutral-900 border border-neutral-700 rounded-2xl w-full max-w-md p-6 relative shadow-2xl">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-neutral-400 hover:text-white"
                >
                    ✕
                </button>

                <h2 className="text-2xl font-bold text-white mb-6 text-center">
                    {mode === 'code' ? 'Brewsader Login' : 'Magic Link'}
                </h2>

                <div className="flex gap-2 mb-6 p-1 bg-neutral-800 rounded-lg">
                    <button
                        className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${mode === 'code' ? 'bg-amber-500 text-black shadow' : 'text-neutral-400 hover:text-white'
                            }`}
                        onClick={() => setMode('code')}
                    >
                        Name + Code
                    </button>
                    <button
                        className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${mode === 'magic' ? 'bg-amber-500 text-black shadow' : 'text-neutral-400 hover:text-white'
                            }`}
                        onClick={() => setMode('magic')}
                    >
                        Magic Link
                    </button>
                </div>

                <form onSubmit={handleLogin} className="space-y-4">
                    {mode === 'code' ? (
                        <>
                            <div>
                                <label className="block text-sm font-medium text-neutral-300 mb-1">
                                    Full Name
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="e.g. Jane Doe"
                                    className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-neutral-300 mb-1">
                                    Brewsader Code
                                </label>
                                <input
                                    type="password"
                                    required
                                    value={code}
                                    onChange={(e) => setCode(e.target.value)}
                                    placeholder="Enter the group code"
                                    className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                                />
                            </div>
                        </>
                    ) : (
                        <div>
                            <label className="block text-sm font-medium text-neutral-300 mb-1">
                                Email Address
                            </label>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="jane@example.com"
                                className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                            />
                            <p className="text-xs text-neutral-500 mt-2">
                                We'll send you a special link to sign in instantly.
                            </p>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-white text-neutral-900 font-bold py-3 rounded-xl hover:bg-neutral-100 transition-colors mt-2 disabled:opacity-50"
                    >
                        {isLoading ? 'Signing in...' : (mode === 'code' ? 'Enter Club' : 'Send Link')}
                    </button>
                </form>
            </div>
        </div>
    )
}
