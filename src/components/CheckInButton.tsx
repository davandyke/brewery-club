'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface CheckInButtonProps {
    breweryId: string
    initialVisited: boolean
}

export function CheckInButton({ breweryId, initialVisited }: CheckInButtonProps) {
    const [visited, setVisited] = useState(initialVisited)
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    const toggleCheckIn = async () => {
        setLoading(true)
        // Optimistic update
        setVisited(!visited)

        try {
            const res = await fetch('/api/checkin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ breweryId }),
            })

            if (!res.ok) {
                throw new Error('Failed to update')
            }

            router.refresh() // Refresh server components to update counts/lists
        } catch (error) {
            // Revert on error
            setVisited(!visited)
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <button
            onClick={(e) => {
                e.preventDefault()
                toggleCheckIn()
            }}
            disabled={loading}
            className={`px-3 py-1 text-xs font-bold rounded-full border transition-all duration-200 flex items-center gap-1
        ${visited
                    ? 'bg-green-600 border-green-500 text-white hover:bg-red-600 hover:border-red-500 hover:text-white group'
                    : 'bg-transparent border-neutral-600 text-neutral-400 hover:border-amber-500 hover:text-amber-500'
                }
      `}
        >
            {visited ? (
                <>
                    <span className="group-hover:hidden">✓ Visited</span>
                    <span className="hidden group-hover:inline">✕ Undo</span>
                </>
            ) : (
                '+ Mark Visited'
            )}
        </button>
    )
}
