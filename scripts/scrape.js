
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');

// --- 1. Setup Env & Prisma ---
const envPath = path.resolve(__dirname, '../.env');
if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf8');
    envConfig.split('\n').forEach(line => {
        const parts = line.split('=');
        if (parts.length >= 2) {
            const key = parts[0].trim();
            let value = parts.slice(1).join('=').trim();
            value = value.replace(/^["']|["']$/g, '');
            process.env[key] = value;
        }
    });
}

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// --- 2. Scraper Logic ---
async function scrape() {
    console.log('Starting Manual Scraper...');

    const browser = await puppeteer.launch({
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
        ],
    });

    try {
        const page = await browser.newPage();

        // Navigate to establish context
        await page.goto('https://brewsader.visitwidget.com/', { waitUntil: 'domcontentloaded' });

        // 1. Fetch Breweries
        console.log('Fetching Breweries...');
        let allBreweries = [];
        let pageNum = 1;
        let keepFetching = true;

        while (keepFetching) {
            console.log(`Fetching page ${pageNum}...`);
            const newBreweries = await page.evaluate(async (p) => {
                const response = await fetch(
                    `https://api.visitwidget.com/api/clients/1037/places?page=${p}&locale=en&category_ids[]=19870&per_page=100`
                );
                return response.json();
            }, pageNum);

            if (newBreweries && newBreweries.length > 0) {
                allBreweries = allBreweries.concat(newBreweries);
                pageNum++;
                // If we get fewer than we asked for OR just a small number, maybe we are done? 
                // But since we get 10 regardless, we just keep going until empty.
            } else {
                keepFetching = false;
            }

            // Safety break
            if (pageNum > 10) keepFetching = false;
        }

        const breweriesData = allBreweries;

        console.log(`Fetched ${breweriesData?.length} breweries`);
        if (breweriesData && breweriesData.length > 0) {
            console.log('First Item Sample:', JSON.stringify(breweriesData[0], null, 2));
        }

        // 2. Fetch Events
        console.log('Fetching Events...');
        const eventsData = await page.evaluate(async () => {
            const response = await fetch(
                'https://api.visitwidget.com/api/clients/1037/events?page=1&locale=en&category_ids[]=20014&per_page=100'
            );
            return response.json();
        });

        console.log(`Fetched ${eventsData?.length} events`);

        if (breweriesData && Array.isArray(breweriesData)) {
            console.log('Upserting Breweries...');
            for (const b of breweriesData) {
                // process.stdout.write('.');
                const loc = b.location || {};
                await prisma.brewery.upsert({
                    where: { visitWidgetId: String(b.id) },
                    update: {
                        name: b.name || b.title, // Fallback just in case
                        address: loc.address || b.address,
                        city: loc.city_from_address || b.city,
                        state: b.state, // Not seen in log, might be missing or in address
                        zip: b.zip, // Not seen
                        latitude: loc.latitude || (b.latitude ? parseFloat(b.latitude) : null),
                        longitude: loc.longitude || (b.longitude ? parseFloat(b.longitude) : null),
                        description: b.description,
                        heroImage: b.cover_photo_url || b.thumbnail_url || b.image?.url,
                        websiteUrl: b.website,
                    },
                    create: {
                        visitWidgetId: String(b.id),
                        name: b.name || b.title,
                        address: loc.address || b.address,
                        city: loc.city_from_address || b.city,
                        state: b.state,
                        zip: b.zip,
                        latitude: loc.latitude || (b.latitude ? parseFloat(b.latitude) : null),
                        longitude: loc.longitude || (b.longitude ? parseFloat(b.longitude) : null),
                        description: b.description,
                        heroImage: b.cover_photo_url || b.thumbnail_url || b.image?.url,
                        websiteUrl: b.website,
                    }
                });
            }
            console.log('\nBreweries updated.');
        }

        // 4. Upsert Events
        if (eventsData && Array.isArray(eventsData)) {
            if (eventsData.length > 0) {
                console.log('First Event Sample:', JSON.stringify(eventsData[0], null, 2));
            }
            console.log('Upserting Events...');
            for (const e of eventsData) {
                // Link event to brewery if place_id matches
                let breweryId = null;
                if (e.place_id) {
                    const brewery = await prisma.brewery.findUnique({
                        where: { visitWidgetId: String(e.place_id) }
                    });
                    if (brewery) breweryId = brewery.id;
                }

                await prisma.event.upsert({
                    where: { visitWidgetId: String(e.id) },
                    update: {
                        title: e.title || e.name, // Guessing 'name' might be used
                        description: e.description,
                        startDate: e.start_date ? new Date(e.start_date) : new Date(),
                        endDate: e.end_date ? new Date(e.end_date) : null,
                        location: e.location?.address || e.location, // Guessing logic
                        url: e.website,
                        imageUrl: e.image?.url || e.cover_photo_url,
                        breweryId: breweryId,
                    },
                    create: {
                        visitWidgetId: String(e.id),
                        title: e.title || e.name,
                        description: e.description,
                        startDate: e.start_date ? new Date(e.start_date) : new Date(),
                        endDate: e.end_date ? new Date(e.end_date) : null,
                        location: e.location?.address || e.location,
                        url: e.website,
                        imageUrl: e.image?.url || e.cover_photo_url,
                        breweryId: breweryId,
                    }
                });
            }
            console.log('Events updated.');
        }

        console.log('✅ Scrape Complete');

    } catch (error) {
        console.error('Scraper Error:', error);
    } finally {
        await browser.close();
        await prisma.$disconnect();
        await pool.end();
    }
}

scrape();
