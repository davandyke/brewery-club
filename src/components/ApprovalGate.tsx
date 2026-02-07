'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function ApprovalGate() {
    const [code, setCode] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        try {
            const res = await fetch('/api/approve', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: code.trim() }),
            })

            if (!res.ok) {
                setError('Invalid code. Ask a club member for the access code.')
                return
            }

            router.refresh()
        } catch {
            setError('Something went wrong. Try again.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="max-w-md mx-auto text-center space-y-6 bg-neutral-800/50 border border-neutral-700 rounded-xl p-8">
            <div className="space-y-2">
                <h2 className="text-2xl font-bold text-white">Welcome to the Club</h2>
                <p className="text-neutral-400 text-sm">
                    Enter the club access code to get started. Ask a member if you don&apos;t have it.
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="Enter access code"
                    className="w-full px-4 py-3 bg-neutral-900 border border-neutral-600 rounded-lg text-white text-center text-lg tracking-widest uppercase placeholder:text-neutral-600 placeholder:normal-case placeholder:tracking-normal focus:outline-none focus:border-amber-500 transition-colors"
                    autoComplete="off"
                />
                {error && (
                    <p className="text-red-400 text-sm">{error}</p>
                )}
                <button
                    type="submit"
                    disabled={loading || !code.trim()}
                    className="w-full bg-amber-500 hover:bg-amber-600 text-black font-bold py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? 'Verifying...' : 'Join the Club'}
                </button>
            </form>
        </div>
    )
}
