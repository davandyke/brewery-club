
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');

// Fix: Correctly parse ENV vars with multiple '='
const envPath = path.resolve(__dirname, '../.env');
if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf8');
    envConfig.split('\n').forEach(line => {
        const parts = line.split('=');
        if (parts.length >= 2) {
            const key = parts[0].trim();
            // Join the rest back together, just in case value has '='
            let value = parts.slice(1).join('=').trim();
            // Remove quotes
            value = value.replace(/^["']|["']$/g, '');
            process.env[key] = value;
        }
    });
}

const connectionString = process.env.DATABASE_URL;
// console.log('DEBUG: Connection String:', connectionString); // Comment out for security, but good for debugging

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function testVeteranMode() {
    console.log('--- Starting Veteran Mode Test ---');

    // 1. Setup Test User
    const testEmail = `test-${Date.now()}@example.com`;
    console.log(`Creating test user: ${testEmail}`);
    const user = await prisma.user.create({
        data: {
            email: testEmail,
            name: 'Test Veteran',
            image: 'https://via.placeholder.com/150'
        }
    });

    try {
        // 2. Count Breweries
        const breweryCount = await prisma.brewery.count();
        console.log(`Total Breweries: ${breweryCount}`);
        if (breweryCount === 0) {
            console.warn('⚠️ No breweries found! Scraper might need to run first.');
            return;
        }

        // 3. Simulate "Mark All Visited" (API Logic)
        console.log('Simulating "Mark All Visited" API call...');
        const breweries = await prisma.brewery.findMany({ select: { id: true } });

        const result = await prisma.checkIn.createMany({
            data: breweries.map(b => ({
                userId: user.id,
                breweryId: b.id
            })),
            skipDuplicates: true
        });

        console.log(`✅ Created ${result.count} check-ins.`);

        // 4. Verify Database State
        const userCheckIns = await prisma.checkIn.count({
            where: { userId: user.id }
        });
        console.log(`User now has ${userCheckIns} check-ins (Expected: ${breweryCount})`);

        if (userCheckIns === breweryCount) {
            console.log('🎉 Veteran Mode Logic: PASSED');
        } else {
            console.error('❌ Veteran Mode Logic: FAILED (Count mismatch)');
        }

    } catch (error) {
        console.error('Test Failed:', error);
    } finally {
        // Cleanup
        console.log('Cleaning up test user...');
        try {
            await prisma.checkIn.deleteMany({ where: { userId: user.id } });
            await prisma.user.delete({ where: { id: user.id } });
        } catch (cleanupError) {
            console.warn('Cleanup failed:', cleanupError);
        }
        await prisma.$disconnect();
        await pool.end();
    }
}

testVeteranMode();
