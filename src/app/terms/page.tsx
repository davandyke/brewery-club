
export default function TermsOfService() {
    return (
        <main className="min-h-screen bg-neutral-900 text-neutral-100 p-8 sm:p-24 max-w-4xl mx-auto">
            <h1 className="text-4xl font-black mb-8 text-amber-500">Terms of Service</h1>

            <section className="space-y-6 text-neutral-300">
                <p>Last updated: {new Date().toLocaleDateString()}</p>

                <h2 className="text-2xl font-bold text-white mt-8">1. Agreement to Terms</h2>
                <p>
                    By accessing our website, you agree to be bound by these Terms of Service and to comply with all applicable laws and regulations.
                </p>

                <h2 className="text-2xl font-bold text-white mt-8">2. Use License</h2>
                <p>
                    Permission is granted to temporarily use the Brewery Social Club website for personal, non-commercial transitory viewing only.
                </p>
                <p>
                    This license shall automatically terminate if you violate any of these restrictions and may be terminated by us at any time.
                </p>

                <h2 className="text-2xl font-bold text-white mt-8">3. Disclaimer</h2>
                <p>
                    The materials on our website are provided on an 'as is' basis. We make no warranties, expressed or implied, and hereby disclaim and negate all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.
                </p>

                <h2 className="text-2xl font-bold text-white mt-8">4. Limitations</h2>
                <p>
                    In no event shall Brewery Social Club or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on our website.
                </p>
            </section>
        </main>
    )
}
