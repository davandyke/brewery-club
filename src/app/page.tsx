import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { LoginButton } from '@/components/LoginButton'
import { NeedToVisitButton } from '@/components/NeedToVisitButton'
import { BulkEditor } from '@/components/BulkEditor'
import { DecisionWheel } from '@/components/DecisionWheel'
import { ApprovalGate } from '@/components/ApprovalGate'

export const revalidate = 0

export default async function Home() {
  const session = await getServerSession(authOptions)

  const user = session?.user?.id
    ? await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { checkIns: true }
    })
    : null

  const isApproved = user?.isApproved ?? false

  // "checkIns" in the DB = breweries this user still needs to visit
  const needToVisitIds = new Set(user?.checkIns.map(c => c.breweryId) || [])

  const breweries = await prisma.brewery.findMany({
    orderBy: { name: 'asc' },
  })

  // Build a map of how many members still need each brewery
  // This powers the weighted random selection
  const allCheckIns = await prisma.checkIn.groupBy({
    by: ['breweryId'],
    _count: { breweryId: true },
  })
  const demandMap = new Map(allCheckIns.map(c => [c.breweryId, c._count.breweryId]))

  // Sort: breweries you still need first, already visited last
  const sortedBreweries = [...breweries].sort((a, b) => {
    const aNeed = needToVisitIds.has(a.id)
    const bNeed = needToVisitIds.has(b.id)
    if (aNeed === bNeed) return 0
    return aNeed ? -1 : 1 // Need-to-visit goes to top
  })

  const needCount = needToVisitIds.size
  const totalCount = breweries.length

  // Fetch events starting from today onwards
  const events = await prisma.event.findMany({
    where: {
      startDate: {
        gte: new Date(),
      },
    },
    orderBy: { startDate: 'asc' },
    take: 20,
    include: {
      brewery: true,
    }
  })

  // Prepare weighted options for the wheel (only breweries the user still needs)
  const wheelOptions = breweries
    .filter(b => needToVisitIds.has(b.id))
    .map(b => ({
      ...b,
      weight: demandMap.get(b.id) || 1, // more members need it = higher weight
    }))

  return (
    <main className="min-h-screen bg-neutral-900 text-neutral-100 p-8 sm:p-24 relative">
      <div className="absolute top-6 right-6">
        <LoginButton />
      </div>

      <div className="max-w-5xl mx-auto space-y-16">

        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-amber-500">
            Brewery Club
          </h1>
          <p className="text-xl text-neutral-400 max-w-2xl mx-auto">
            Planning our next brewery visit in Grand Rapids, MI.
          </p>
          <p className="text-sm text-neutral-500 max-w-xl mx-auto">
            Select which breweries you still need to check in to. The more members who need a brewery, the more likely it gets picked as our next stop.
          </p>
        </div>

        {/* Approval Gate or Decision Support */}
        {user && !isApproved && (
          <ApprovalGate />
        )}

        {user && isApproved && (
          <div className="space-y-8">
            <DecisionWheel options={wheelOptions} />

            <div className="bg-neutral-800/50 border border-neutral-700 p-4 rounded-xl flex flex-col sm:flex-row justify-between items-center gap-4">
              <div>
                <h2 className="font-bold text-white text-lg">My Remaining Breweries</h2>
                <p className="text-neutral-400 text-sm">
                  {needCount} of {totalCount} breweries you still need to visit
                </p>
              </div>
              <BulkEditor
                breweries={breweries}
                initialCheckedIds={Array.from(needToVisitIds)}
              />
            </div>
          </div>
        )}

        {/* Upcoming Events Section */}
        <section className="space-y-8">
          <h2 className="text-3xl font-bold border-b border-neutral-800 pb-4">
            Upcoming Events
          </h2>

          {events.length === 0 ? (
            <p className="text-neutral-500 italic">No upcoming events found. Data might still be syncing.</p>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {events.map((event) => (
                <div key={event.id} className="bg-neutral-800 rounded-xl overflow-hidden border border-neutral-700 hover:border-amber-500/50 transition-colors flex flex-col">
                  {event.imageUrl && (
                    <div className="aspect-video relative">
                      <img
                        src={event.imageUrl}
                        alt={event.title}
                        className="object-cover w-full h-full"
                      />
                    </div>
                  )}
                  <div className="p-6 flex-1 flex flex-col">
                    <div className="text-sm text-amber-500 font-medium mb-2">
                      {event.startDate.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <h3 className="text-xl font-bold mb-2 text-white">{event.title}</h3>
                    {event.brewery && (
                      <p className="text-sm text-neutral-400 mb-4">{event.brewery.name}</p>
                    )}
                    <div className="mt-auto pt-4">
                      {event.url && (
                        <a
                          href={event.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-block text-sm font-semibold text-white bg-neutral-700 hover:bg-neutral-600 py-2 px-4 rounded-lg transition-colors"
                        >
                          View Details
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Breweries Section */}
        <section className="space-y-8">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
            <h2 className="text-3xl font-bold">
              Local Breweries <span className="text-lg font-normal text-neutral-500 ml-2">({breweries.length})</span>
            </h2>
          </div>

          {breweries.length === 0 ? (
            <p className="text-neutral-500 italic">No breweries found. Scraper might need to run.</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {sortedBreweries.map((brewery) => {
                const stillNeeds = needToVisitIds.has(brewery.id)
                const memberDemand = demandMap.get(brewery.id) || 0
                return (
                  <div
                    key={brewery.id}
                    className={`p-4 rounded-lg border transition-all duration-300 relative group flex flex-col
                            ${stillNeeds
                        ? 'bg-neutral-800 border-amber-500/30 hover:border-amber-500 shadow-lg shadow-amber-900/10'
                        : 'bg-neutral-900 border-neutral-800 opacity-50 hover:opacity-100'
                      }
                        `}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className={`font-bold text-lg truncate pr-2 ${stillNeeds ? 'text-white' : 'text-neutral-500 line-through'}`}>{brewery.name}</h3>
                    </div>
                    <p className="text-sm text-neutral-400 truncate mb-1">{brewery.address}, {brewery.city}</p>
                    {memberDemand > 0 && (
                      <p className="text-xs text-amber-500/70 mb-3">
                        {memberDemand} {memberDemand === 1 ? 'member needs' : 'members need'} this
                      </p>
                    )}

                    {/* Action Area */}
                    <div className="mt-auto flex items-center justify-between">
                      {user && isApproved ? (
                        <NeedToVisitButton breweryId={brewery.id} initialNeedsVisit={stillNeeds} />
                      ) : (
                        <span className="text-xs text-neutral-600">{user ? '' : 'Login to participate'}</span>
                      )}

                      {brewery.websiteUrl && (
                        <a
                          href={brewery.websiteUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-neutral-500 hover:text-amber-500 transition-colors"
                        >
                          Website &rarr;
                        </a>
                      )}
                    </div>

                    {stillNeeds && user && isApproved && (
                      <div className="absolute -top-1 -right-1 flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
                      </div>
                    )}

                  </div>
                )
              })}
            </div>
          )}
        </section>

      </div>

      {/* Footer */}
      <footer className="max-w-5xl mx-auto mt-16 pt-8 border-t border-neutral-800 text-center text-xs text-neutral-600 space-x-4 pb-8">
        <a href="/privacy" className="hover:text-neutral-400 transition-colors">Privacy Policy</a>
        <a href="/terms" className="hover:text-neutral-400 transition-colors">Terms of Service</a>
      </footer>
    </main>
  )
}
