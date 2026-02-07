
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
    breweries: { id: string; name: string; city: string | null }[]
    initialCheckedIds: string[]
}

export function BulkEditor({ breweries, initialCheckedIds }: Props) {
    const [isOpen, setIsOpen] = useState(false)
    const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set(initialCheckedIds))
    const [isSaving, setIsSaving] = useState(false)
    const router = useRouter()

    const toggleBrewery = (id: string) => {
        const newSet = new Set(checkedIds)
        if (newSet.has(id)) {
            newSet.delete(id)
        } else {
            newSet.add(id)
        }
        setCheckedIds(newSet)
    }

    const selectAll = () => {
        const allIds = breweries.map(b => b.id)
        setCheckedIds(new Set(allIds))
    }

    const selectNone = () => {
        setCheckedIds(new Set())
    }

    const handleSave = async () => {
        setIsSaving(true)
        try {
            await fetch('/api/checkin/batch', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ breweryIds: Array.from(checkedIds).map(String) })
            })
            router.refresh()
            setIsOpen(false)
        } catch (error) {
            console.error('Failed to save bulk edits', error)
            alert('Something went wrong saving your changes.')
        } finally {
            setIsSaving(false)
        }
    }

    // Derived state for button text
    const isAllSelected = breweries.length > 0 && checkedIds.size === breweries.length

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors w-full sm:w-auto text-center"
            >
                Edit List / Bulk Check-in
            </button>
        )
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-neutral-900 border border-neutral-700 rounded-xl w-full max-w-lg flex flex-col max-h-[90vh] shadow-2xl">
                {/* Header */}
                <div className="p-4 border-b border-neutral-800 flex justify-between items-center">
                    <h2 className="text-lg font-bold text-white">Manage Your Visits</h2>
                    <button
                        onClick={() => setIsOpen(false)}
                        className="text-neutral-400 hover:text-white"
                        aria-label="Close"
                    >
                        ✕
                    </button>
                </div>

                {/* Actions */}
                <div className="p-4 bg-neutral-900/50 flex gap-2 border-b border-neutral-800 sticky top-0 z-10">
                    <button
                        onClick={isAllSelected ? selectNone : selectAll}
                        className="px-3 py-1.5 text-xs font-medium bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded border border-neutral-600 transition-colors"
                    >
                        {isAllSelected ? "Deselect All" : "Select All (I've been everywhere!)"}
                    </button>
                    <div className="flex-grow"></div>
                    <span className="text-xs text-neutral-400 self-center">
                        {checkedIds.size} / {breweries.length} Selected
                    </span>
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                    {breweries.map(brewery => (
                        <label
                            key={brewery.id}
                            className={`flex items-center p-3 rounded-lg cursor-pointer transition-colors ${checkedIds.has(brewery.id)
                                ? 'bg-amber-900/20 border border-amber-500/30'
                                : 'hover:bg-neutral-800 border border-transparent'
                                }`}
                        >
                            <input
                                type="checkbox"
                                className="w-5 h-5 rounded border-neutral-600 text-amber-500 focus:ring-amber-500 bg-neutral-800"
                                checked={checkedIds.has(brewery.id)}
                                onChange={() => toggleBrewery(brewery.id)}
                            />
                            <div className="ml-3 flex-1">
                                <span className={`block font-medium ${checkedIds.has(brewery.id) ? 'text-amber-100' : 'text-neutral-300'}`}>
                                    {brewery.name}
                                </span>
                                {brewery.city && (
                                    <span className="text-xs text-neutral-500">{brewery.city}</span>
                                )}
                            </div>
                        </label>
                    ))}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-neutral-800 bg-neutral-900 flex justify-end gap-3 rounded-b-xl">
                    <button
                        onClick={() => setIsOpen(false)}
                        className="px-4 py-2 text-sm text-neutral-400 hover:text-white transition-colors"
                        disabled={isSaving}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="bg-amber-500 hover:bg-amber-600 text-black font-bold px-6 py-2 rounded-lg text-sm transition-all transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSaving ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </div>
        </div>
    )
}
