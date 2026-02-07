'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface NeedToVisitButtonProps {
    breweryId: string
    initialNeedsVisit: boolean
}

export function NeedToVisitButton({ breweryId, initialNeedsVisit }: NeedToVisitButtonProps) {
    const [needsVisit, setNeedsVisit] = useState(initialNeedsVisit)
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    const toggle = async () => {
        setLoading(true)
        setNeedsVisit(!needsVisit)

        try {
            const res = await fetch('/api/checkin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ breweryId }),
            })

            if (!res.ok) {
                throw new Error('Failed to update')
            }

            router.refresh()
        } catch (error) {
            setNeedsVisit(needsVisit)
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <button
            onClick={(e) => {
                e.preventDefault()
                toggle()
            }}
            disabled={loading}
            className={`px-3 py-1 text-xs font-bold rounded-full border transition-all duration-200 flex items-center gap-1
        ${needsVisit
                    ? 'bg-amber-600 border-amber-500 text-white hover:bg-neutral-700 hover:border-neutral-500 group'
                    : 'bg-transparent border-neutral-600 text-neutral-400 hover:border-amber-500 hover:text-amber-500'
                }
      `}
        >
            {needsVisit ? (
                <>
                    <span className="group-hover:hidden">Need to Visit</span>
                    <span className="hidden group-hover:inline">Done</span>
                </>
            ) : (
                'Add Back'
            )}
        </button>
    )
}
