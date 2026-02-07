'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function VeteranModeButton() {
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    const handleMarkAll = async () => {
        if (!confirm("Are you sure? This will mark ALL breweries as visited. You can then uncheck the ones you still need.")) {
            return
        }

        setLoading(true)
        try {
            const res = await fetch('/api/checkin/all', { method: 'POST' })
            if (res.ok) {
                router.refresh()
            }
        } catch (error) {
            console.error(error)
            alert("Failed to update.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <button
            onClick={handleMarkAll}
            disabled={loading}
            className="text-xs text-neutral-400 hover:text-white underline decoration-neutral-600 hover:decoration-white underline-offset-4 transition-all"
        >
            {loading ? 'Updating...' : 'Veteran? Mark ALL as Visited'}
        </button>
    )
}
