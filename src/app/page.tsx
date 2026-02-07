import { prisma } from '@/lib/prisma'

// Import LoginButton - we might need to make this a client component or import purely
// But since LoginButton is 'use client', it can be imported in server component 'page.tsx'.
import { LoginButton } from '@/components/LoginButton'

export const revalidate = 3600 // Revalidate at least every hour

export default async function Home() {
  const breweries = await prisma.brewery.findMany({
    orderBy: { name: 'asc' },
  })

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
          <h2 className="text-3xl font-bold border-b border-neutral-800 pb-4">
            Local Breweries <span className="text-lg font-normal text-neutral-500 ml-2">({breweries.length})</span>
          </h2>

          {breweries.length === 0 ? (
            <p className="text-neutral-500 italic">No breweries found. Scraper might need to run.</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {breweries.map((brewery) => (
                <div key={brewery.id} className="bg-neutral-800 p-4 rounded-lg border border-neutral-700 hover:bg-neutral-750 transition-colors">
                  <h3 className="font-bold text-lg text-white truncate">{brewery.name}</h3>
                  <p className="text-sm text-neutral-400 truncate">{brewery.address}, {brewery.city}</p>
                  {brewery.websiteUrl && (
                    <a
                      href={brewery.websiteUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-amber-500 hover:text-amber-400 mt-2 inline-block"
                    >
                      Visit Website &rarr;
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

      </div>
    </main>
  )
}
