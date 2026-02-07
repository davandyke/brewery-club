'use client'

import { useState } from 'react'

interface WeightedBrewery {
    id: string
    name: string
    city: string | null
    description: string | null
    weight: number
}

interface Props {
    options: WeightedBrewery[]
}

/**
 * Picks a random brewery using weighted selection.
 * Breweries that more members still need are more likely to be chosen.
 */
function weightedRandomPick(options: WeightedBrewery[]): WeightedBrewery {
    const totalWeight = options.reduce((sum, o) => sum + o.weight, 0)
    let random = Math.random() * totalWeight
    for (const option of options) {
        random -= option.weight
        if (random <= 0) return option
    }
    // Fallback (shouldn't happen)
    return options[options.length - 1]
}

export function DecisionWheel({ options }: Props) {
    const [isSpinning, setIsSpinning] = useState(false)
    const [winner, setWinner] = useState<WeightedBrewery | null>(null)

    const handleSpin = () => {
        if (options.length === 0) return
        setIsSpinning(true)
        setWinner(null)

        setTimeout(() => {
            setWinner(weightedRandomPick(options))
            setIsSpinning(false)
        }, 2000)
    }

    if (options.length === 0) {
        return (
            <div className="text-center p-6 bg-neutral-800 rounded-xl border border-neutral-700">
                <p className="text-neutral-400">You&apos;ve been everywhere! Remove some to re-add them to the pool, or bask in glory.</p>
            </div>
        )
    }

    return (
        <div className="w-full">
            <button
                onClick={handleSpin}
                disabled={isSpinning}
                className={`w-full py-4 rounded-xl text-xl font-black uppercase tracking-wider transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg ${isSpinning
                        ? 'bg-neutral-700 text-neutral-400 cursor-wait'
                        : 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white shadow-amber-900/20'
                    }`}
            >
                {isSpinning ? 'Choosing Destiny...' : 'Where Should We Go Next?'}
            </button>
            <p className="text-center text-xs text-neutral-600 mt-2">
                Weighted by how many members still need each brewery
            </p>

            {/* Winner Modal */}
            {winner && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-neutral-900 border border-amber-500 rounded-2xl max-w-lg w-full p-8 text-center relative shadow-2xl shadow-amber-500/20">
                        <button
                            onClick={() => setWinner(null)}
                            className="absolute top-4 right-4 text-neutral-400 hover:text-white"
                        >
                            ✕
                        </button>

                        <div className="mb-6">
                            <span className="inline-block px-3 py-1 rounded-full bg-amber-500/20 text-amber-500 text-sm font-bold uppercase tracking-widest mb-4">
                                Next Stop
                            </span>
                            <h2 className="text-4xl sm:text-5xl font-black text-white mb-2 leading-tight">
                                {winner.name}
                            </h2>
                            {winner.city && (
                                <p className="text-xl text-neutral-400">{winner.city}</p>
                            )}
                            <p className="text-sm text-amber-500/70 mt-2">
                                {winner.weight} {winner.weight === 1 ? 'member' : 'members'} still {winner.weight === 1 ? 'needs' : 'need'} this one
                            </p>
                        </div>

                        {winner.description && (
                            <div className="bg-neutral-800/50 p-4 rounded-lg mb-8 text-left max-h-40 overflow-y-auto">
                                <div
                                    className="text-neutral-300 text-sm leading-relaxed prose prose-invert prose-sm max-w-none"
                                    dangerouslySetInnerHTML={{ __html: winner.description }}
                                />
                            </div>
                        )}

                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                            <button
                                onClick={() => {
                                    setWinner(null)
                                    handleSpin()
                                }}
                                className="px-6 py-3 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg font-bold transition-colors"
                            >
                                Try Again
                            </button>
                            <a
                                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${winner.name} ${winner.city} MI`)}`}
                                target="_blank"
                                rel="noreferrer"
                                className="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-black rounded-lg font-bold transition-colors flex items-center justify-center gap-2"
                            >
                                Get Directions
                            </a>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
