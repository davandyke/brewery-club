import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "./prisma"

export const authOptions: NextAuthOptions = {
    adapter: PrismaAdapter(prisma) as any,
    session: {
        strategy: "jwt",
    },
    providers: [
        CredentialsProvider({
            name: "Brewsader Code",
            credentials: {
                firstName: { label: "First Name", type: "text", placeholder: "Jane" },
                lastName: { label: "Last Name", type: "text", placeholder: "Doe" },
                code: { label: "Brewsader Code", type: "password" }
            },
            async authorize(credentials) {
                if (!credentials?.firstName || !credentials?.lastName || !credentials?.code) {
                    return null
                }

                // Default to "BREWSADER" if not set in env
                const BREWSADER_CODE = process.env.BREWSADER_CODE || "BREWSADER"
                const ADMIN_CODE = "WHITEPINE"

                const firstName = credentials.firstName.trim()
                const lastName = credentials.lastName.trim()
                const fullName = `${firstName} ${lastName}`.trim()

                // Check specific admin credentials
                const isAdminLogin =
                    fullName.toLowerCase() === 'david van dyke' &&
                    credentials.code === ADMIN_CODE

                // Check standard access code
                const isStandardLogin = credentials.code === BREWSADER_CODE

                if (!isAdminLogin && !isStandardLogin) {
                    return null
                }

                // Find or create user by name
                let user = await prisma.user.findFirst({
                    where: { name: { equals: fullName, mode: 'insensitive' } }
                })

                if (!user) {
                    user = await prisma.user.create({
                        data: {
                            name: fullName,
                            isAdmin: isAdminLogin, // Set admin if this was an admin login
                        }
                    })
                } else if (isAdminLogin && !user.isAdmin) {
                    // Upgrade to admin if logging in with admin code
                    user = await prisma.user.update({
                        where: { id: user.id },
                        data: { isAdmin: true }
                    })
                }

                return {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    isAdmin: user.isAdmin,
                    isApproved: user.isApproved,
                }
            }
        }),
    ],
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id
                token.isAdmin = (user as any).isAdmin
                token.isApproved = (user as any).isApproved
            }
            return token
        },
        async session({ session, token }) {
            if (session.user && token) {
                session.user.id = token.id as string
                session.user.isAdmin = token.isAdmin as boolean
                session.user.isApproved = token.isApproved as boolean
            }
            return session
        }
    }
}
