import { prisma } from './prisma'

export interface BrewerySuggestion {
    id: string
    name: string
    missingCheckIns: number
}

// "Most Needed" Suggestion Engine
export async function getMostNeededBreweries(): Promise<BrewerySuggestion[]> {
    // 1. Get all users who are marked as "Attending Next Week"
    const attendingUsers = await prisma.user.findMany({
        where: {
            isAttendingNextWeek: true,
        },
        include: {
            checkIns: true,
        },
    })

    // 2. Get all breweries
    const allBreweries = await prisma.brewery.findMany()

    // 3. Calculate "missing check-ins" for each brewery
    const suggestions = allBreweries.map((brewery) => {
        let missingCount = 0

        for (const user of attendingUsers) {
            const hasCheckedIn = user.checkIns.some(
                (checkIn) => checkIn.breweryId === brewery.id
            )

            if (!hasCheckedIn) {
                missingCount++
            }
        }

        return {
            id: brewery.id,
            name: brewery.name,
            missingCheckIns: missingCount,
        }
    })

    // 4. Sort by most missing check-ins (descending)
    return suggestions.sort((a, b) => b.missingCheckIns - a.missingCheckIns)
}
