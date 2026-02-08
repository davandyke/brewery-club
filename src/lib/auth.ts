import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import EmailProvider from "next-auth/providers/email"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "./prisma"

export const authOptions: NextAuthOptions = {
    adapter: PrismaAdapter(prisma) as any,
    session: {
        strategy: "jwt",
    },
    providers: [
        EmailProvider({
            server: process.env.EMAIL_SERVER,
            from: process.env.EMAIL_FROM,
        }),
        CredentialsProvider({
            name: "Brewsader Code",
            credentials: {
                name: { label: "Name", type: "text", placeholder: "Jane Doe" },
                code: { label: "Brewsader Code", type: "password" }
            },
            async authorize(credentials) {
                if (!credentials?.name || !credentials?.code) {
                    return null
                }

                const BREWSADER_CODE = process.env.BREWSADER_CODE
                if (!BREWSADER_CODE) {
                    throw new Error("BREWSADER_CODE not configured")
                }

                if (credentials.code !== BREWSADER_CODE) {
                    return null
                }

                // Find or create user by name
                const name = credentials.name.trim()

                let user = await prisma.user.findFirst({
                    where: { name }
                })

                if (!user) {
                    user = await prisma.user.create({
                        data: {
                            name,
                        }
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
