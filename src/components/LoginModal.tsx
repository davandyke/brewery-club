'use client'

import { useState, useEffect } from 'react'
import { signIn } from 'next-auth/react'
import { useSearchParams } from 'next/navigation'

interface LoginModalProps {
    isOpen: boolean
    onClose: () => void
}

export function LoginModal({ isOpen, onClose }: LoginModalProps) {
    const searchParams = useSearchParams()
    const [firstName, setFirstName] = useState('')
    const [lastName, setLastName] = useState('')
    const [code, setCode] = useState('')
    const [isLoading, setIsLoading] = useState(false)

    // Auto-fill code from URL query param
    useEffect(() => {
        const codeParam = searchParams?.get('code')
        if (codeParam) {
            setCode(codeParam)
        }
    }, [searchParams])

    if (!isOpen) return null

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)

        try {
            const result = await signIn('credentials', {
                firstName,
                lastName,
                code,
                redirect: false,
            })

            if (result?.error) {
                alert('Invalid name or code')
            } else {
                onClose()
                window.location.reload()
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
                    Brewery Club Login
                </h2>

                <form onSubmit={handleLogin} className="space-y-4">
                    <div className="flex gap-4">
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-neutral-300 mb-1">
                                First Name
                            </label>
                            <input
                                type="text"
                                required
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                                placeholder="Jane"
                                className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                            />
                        </div>
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-neutral-300 mb-1">
                                Last Name
                            </label>
                            <input
                                type="text"
                                required
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
                                placeholder="Doe"
                                className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-neutral-300 mb-1">
                            Access Code
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

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-white text-neutral-900 font-bold py-3 rounded-xl hover:bg-neutral-100 transition-colors mt-2 disabled:opacity-50"
                    >
                        {isLoading ? 'Signing in...' : 'Enter Club'}
                    </button>
                </form>
            </div>
        </div>
    )
}
