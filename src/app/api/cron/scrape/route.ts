import { NextResponse } from 'next/server'
import puppeteer from 'puppeteer'
import { prisma } from '@/lib/prisma'

// Type definitions based on expected VisitWidget JSON structure
// Monitor actual response to refine these interfaces.
interface VisitWidgetPlace {
    id: number
    title: string
    address?: string
    city?: string
    state?: string
    zip?: string
    latitude?: string
    longitude?: string
    description?: string
    image?: { url: string }
    website?: string
    // Add other fields as needed
}

interface VisitWidgetEvent {
    id: number
    title: string
    description?: string
    start_date?: string
    end_date?: string
    location?: string
    website?: string
    image?: { url: string }
    place_id?: number // Associated brewery ID logic needed
}

export async function GET(req: Request) {
    // Security: Recommended to check Authorization header for CRON_SECRET
    // if (req.headers.get('Authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    console.log('Starting Scraper...')

    const browser = await puppeteer.launch({
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            // optimize for serverless environment if needed
        ],
    })

    try {
        const page = await browser.newPage()

        // Navigate to the site to establish context (cookies, headers, etc.)
        await page.goto('https://brewsader.visitwidget.com/', { waitUntil: 'domcontentloaded' })

        // 1. Fetch Breweries (Places)
        // Using the exact JSON endpoint discovered: category_ids[]=19870 for Breweries
        const breweriesData: VisitWidgetPlace[] = await page.evaluate(async () => {
            const response = await fetch(
                'https://api.visitwidget.com/api/clients/1037/places?page=1&locale=en&category_ids[]=19870&per_page=100' // Added per_page for safety
            )
            return response.json()
        })

        console.log(`Fetched ${breweriesData?.length} breweries`)

        // 2. Fetch Events
        // Using category_ids[]=20014 for Beer Events
        const eventsData: VisitWidgetEvent[] = await page.evaluate(async () => {
            const response = await fetch(
                'https://api.visitwidget.com/api/clients/1037/events?page=1&locale=en&category_ids[]=20014&per_page=100'
            )
            return response.json()
        })

        console.log(`Fetched ${eventsData?.length} events`)

        // 3. Process & Upsert Breweries
        if (breweriesData && Array.isArray(breweriesData)) {
            for (const b of breweriesData) {
                const loc = (b as any).location || {}
                // Type casting b as any because interface VisitWidgetPlace is distinct from actual response
                // We should update interface but for now 'any' works to unblock.
                const anyB = b as any

                await prisma.brewery.upsert({
                    where: { visitWidgetId: String(b.id) },
                    update: {
                        name: anyB.name || b.title,
                        address: loc.address || b.address,
                        city: loc.city_from_address || b.city,
                        state: b.state,
                        zip: b.zip,
                        latitude: loc.latitude || (b.latitude ? parseFloat(b.latitude) : null),
                        longitude: loc.longitude || (b.longitude ? parseFloat(b.longitude) : null),
                        description: b.description,
                        heroImage: anyB.cover_photo_url || anyB.thumbnail_url || b.image?.url,
                        websiteUrl: anyB.website || b.website,
                    },
                    create: {
                        visitWidgetId: String(b.id),
                        name: anyB.name || b.title,
                        address: loc.address || b.address,
                        city: loc.city_from_address || b.city,
                        state: b.state,
                        zip: b.zip,
                        latitude: loc.latitude || (b.latitude ? parseFloat(b.latitude) : null),
                        longitude: loc.longitude || (b.longitude ? parseFloat(b.longitude) : null),
                        description: b.description,
                        heroImage: anyB.cover_photo_url || anyB.thumbnail_url || b.image?.url,
                        websiteUrl: anyB.website || b.website,
                    }
                })
            }
        }

        // 4. Process & Upsert Events
        if (eventsData && Array.isArray(eventsData)) {
            for (const e of eventsData) {
                const anyE = e as any
                // Link event to brewery if place_id matches
                let breweryId = null

                if (anyE.place_id) {
                    const brewery = await prisma.brewery.findUnique({
                        where: { visitWidgetId: String(anyE.place_id) }
                    })
                    if (brewery) breweryId = brewery.id
                }

                await prisma.event.upsert({
                    where: { visitWidgetId: String(e.id) },
                    update: {
                        title: anyE.name || e.title,
                        description: e.description,
                        startDate: anyE.starts_on ? new Date(anyE.starts_on) : (e.start_date ? new Date(e.start_date) : new Date()),
                        endDate: anyE.ends_on ? new Date(anyE.ends_on) : (e.end_date ? new Date(e.end_date) : null),
                        location: anyE.location?.address || e.location,
                        url: anyE.website || e.website,
                        imageUrl: anyE.cover_photo_url || e.image?.url,
                        breweryId: breweryId,
                    },
                    create: {
                        visitWidgetId: String(e.id),
                        title: anyE.name || e.title,
                        description: e.description,
                        startDate: anyE.starts_on ? new Date(anyE.starts_on) : (e.start_date ? new Date(e.start_date) : new Date()),
                        endDate: anyE.ends_on ? new Date(anyE.ends_on) : (e.end_date ? new Date(e.end_date) : null),
                        location: anyE.location?.address || e.location,
                        url: anyE.website || e.website,
                        imageUrl: anyE.cover_photo_url || e.image?.url,
                        breweryId: breweryId,
                    }
                })
            }
        }

        return NextResponse.json({
            success: true,
            breweriesProcessed: breweriesData?.length ?? 0,
            eventsProcessed: eventsData?.length ?? 0
        })

    } catch (error) {
        console.error('Scraper Error:', error)
        return NextResponse.json(
            { error: 'Failed to scrape', details: error instanceof Error ? error.message : String(error) },
            { status: 500 }
        )
    } finally {
        await browser.close()
    }
}
