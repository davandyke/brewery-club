import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { LoginButton } from '@/components/LoginButton'
import { CheckInButton } from '@/components/CheckInButton'
import { BulkEditor } from '@/components/BulkEditor'

export const revalidate = 0 // Dynamic now because of user session

// server component
export default async function Home() {
  const session = await getServerSession(authOptions)

  // Fix: Lookup by ID, not email, since email might be missing
  const user = session?.user?.id
    ? await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { checkIns: true }
    })
    : null

  const checkInIds = new Set(user?.checkIns.map(c => c.breweryId) || [])

  const breweries = await prisma.brewery.findMany({
    orderBy: { name: 'asc' },
  })

  // Sort: Unvisited first, then Visited
  const sortedBreweries = [...breweries].sort((a, b) => {
    const aVisited = checkInIds.has(a.id)
    const bVisited = checkInIds.has(b.id)
    if (aVisited === bVisited) return 0
    return aVisited ? 1 : -1 // Visited goes to bottom
  })

  const visitedCount = checkInIds.size
  const totalCount = breweries.length
  const progressPercentage = totalCount > 0 ? Math.round((visitedCount / totalCount) * 100) : 0

  // Fetch events starting from today onwards
  const events = await prisma.event.findMany({
    where: {
      startDate: {
        gte: new Date(),
      },
    },
    orderBy: { startDate: 'asc' },
    take: 20, // Limit to next 20 events
    include: {
      brewery: true,
    }
  })

  return (
    <main className="min-h-screen bg-neutral-900 text-neutral-100 p-8 sm:p-24 relative">
      <div className="absolute top-6 right-6">
        <LoginButton />
      </div>

      <div className="max-w-5xl mx-auto space-y-16">

        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-amber-500">
            Brewery Social Club
          </h1>
          <p className="text-xl text-neutral-400 max-w-2xl mx-auto">
            Discover local brews, track your visits, and join the community in Grand Rapids, MI.
          </p>
        </div>

        {/* Progress Section (Only if logged in) */}
        {user && (
          <div className="bg-neutral-800 p-6 rounded-2xl border border-neutral-700">
            <div className="flex justify-between items-end mb-2">
              <h2 className="text-2xl font-bold text-white">Your Brewsader Progress</h2>
              <span className="text-3xl font-black text-amber-500">{visitedCount} <span className="text-lg text-neutral-500 font-medium">/ {totalCount}</span></span>
            </div>
            <div className="w-full bg-neutral-700 rounded-full h-4 overflow-hidden mb-4">
              <div
                className="bg-gradient-to-r from-amber-600 to-amber-400 h-4 rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>

            <div className="flex justify-between items-center bg-neutral-900/50 p-3 rounded-lg">
              <p className="text-sm text-neutral-300">
                Manage your progress:
              </p>
              <BulkEditor
                breweries={breweries}
                initialCheckedIds={Array.from(checkInIds)}
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
                const isVisited = checkInIds.has(brewery.id)
                return (
                  <div
                    key={brewery.id}
                    className={`p-4 rounded-lg border transition-all duration-300 relative group flex flex-col
                            ${isVisited
                        ? 'bg-neutral-900 border-neutral-800 opacity-50 hover:opacity-100 order-last'
                        : 'bg-neutral-800 border-amber-500/30 hover:border-amber-500 shadow-lg shadow-amber-900/10 order-first'
                      }
                        `}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className={`font-bold text-lg truncate pr-2 ${isVisited ? 'text-neutral-500 line-through' : 'text-white'}`}>{brewery.name}</h3>
                    </div>
                    <p className="text-sm text-neutral-400 truncate mb-4">{brewery.address}, {brewery.city}</p>

                    {/* Action Area */}
                    <div className="mt-auto flex items-center justify-between">
                      {user ? (
                        <CheckInButton breweryId={brewery.id} initialVisited={isVisited} />
                      ) : (
                        <span className="text-xs text-neutral-600">Login to check in</span>
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

                    {!isVisited && user && (
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
    </main>
  )
}
