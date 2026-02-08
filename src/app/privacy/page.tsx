
export default function PrivacyPolicy() {
    return (
        <main className="min-h-screen bg-neutral-900 text-neutral-100 p-8 sm:p-24 max-w-4xl mx-auto">
            <h1 className="text-4xl font-black mb-8 text-amber-500">Privacy Policy</h1>

            <section className="space-y-6 text-neutral-300">
                <p>Last updated: {new Date().toLocaleDateString()}</p>

                <h2 className="text-2xl font-bold text-white mt-8">1. Introduction</h2>
                <p>
                    Welcome to Brewery Club ("we", "our", or "us"). We respect your privacy and are committed to protecting your personal data.
                    This privacy policy will inform you as to how we look after your personal data when you visit our website (regardless of where you visit it from)
                    and tell you about your privacy rights and how the law protects you.
                </p>

                <h2 className="text-2xl font-bold text-white mt-8">2. Data We Collect</h2>
                <p>
                    We may collect, use, store and transfer different kinds of personal data about you which we have grouped together follows:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                    <li><strong>Identity Data:</strong> Includes first name, last name, and profile picture provided by Facebook Login.</li>
                    <li><strong>Usage Data:</strong> Includes information about how you use our website, specifically which breweries you mark as visited or select for your list.</li>
                </ul>

                <h2 className="text-2xl font-bold text-white mt-8">3. How We Use Your Data</h2>
                <p>
                    We will only use your personal data when the law allows us to. Most commonly, we will use your personal data in the following circumstances:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                    <li>To authenticate you via Facebook Login.</li>
                    <li>To save your "My Shortlist" and visit history so it persists across sessions.</li>
                </ul>

                <h2 className="text-2xl font-bold text-white mt-8">4. Data Deletion</h2>
                <p>
                    If you wish to delete your account and all associated data, please contact us or use the Facebook "Apps and Websites" settings to remove our app access.
                    Upon removal, we will cease to have access to your Facebook data. You may also request full deletion of your check-in history by contacting the administrator.
                </p>

                <h2 className="text-2xl font-bold text-white mt-8">5. Contact Us</h2>
                <p>
                    If you have any questions about this privacy policy or our privacy practices, please contact the repository maintainer.
                </p>
            </section>
        </main>
    )
}
