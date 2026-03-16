import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import Google from "next-auth/providers/google"
import { db } from "@/db/index"
import { users, organizations } from "@/db/schema"
import { eq } from "drizzle-orm"
import bcrypt from "bcryptjs"

async function getOrCreateGoogleUser(profile: {
  email: string
  name: string
  picture?: string
}) {
  // Check if user already exists
  let user = await db.query.users.findFirst({
    where: eq(users.email, profile.email),
  })

  if (!user) {
    // Create org for new Google user
    const slug =
      profile.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") +
      "-" +
      Date.now().toString(36)

    const [org] = await db
      .insert(organizations)
      .values({
        name: `${profile.name}'s Team`,
        slug,
        tier: "free",
      })
      .returning()

    // Create user (no password needed for Google users)
    const [newUser] = await db
      .insert(users)
      .values({
        email: profile.email,
        name: profile.name,
        passwordHash: "__google_oauth__",
        avatarUrl: profile.picture ?? null,
        orgId: org.id,
        role: "admin",
      })
      .returning()

    user = newUser
  }

  // Get org name
  let orgName = ""
  if (user.orgId) {
    const org = await db.query.organizations.findFirst({
      where: eq(organizations.id, user.orgId),
    })
    orgName = org?.name ?? ""
  }

  return { user, orgName }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "google" && profile?.email) {
        // Ensure user exists in our DB
        await getOrCreateGoogleUser({
          email: profile.email,
          name: profile.name ?? user.name ?? "Usuario",
          picture: (profile as { picture?: string }).picture,
        })
      }
      return true
    },
    async jwt({ token, user, account, profile }) {
      // On initial sign-in
      if (user && account?.provider === "credentials") {
        token.id = user.id
        token.role = user.role
        token.orgId = user.orgId
        token.orgName = user.orgName
      }

      // For Google sign-in, load from DB
      if (account?.provider === "google" && profile?.email) {
        const result = await getOrCreateGoogleUser({
          email: profile.email,
          name: profile.name ?? "Usuario",
          picture: (profile as { picture?: string }).picture,
        })
        token.id = result.user.id
        token.role = result.user.role
        token.orgId = result.user.orgId ?? ""
        token.orgName = result.orgName
      }

      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as string
        session.user.orgId = token.orgId as string
        session.user.orgName = token.orgName as string
      }
      return session
    },
  },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!.trim(),
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!.trim(),
      authorization: {
        params: {
          prompt: "select_account",
        },
      },
    }),
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const email = credentials.email as string
        const password = credentials.password as string

        const user = await db.query.users.findFirst({
          where: eq(users.email, email),
        })

        if (!user) return null
        if (user.passwordHash === "__google_oauth__") return null

        const isValid = await bcrypt.compare(password, user.passwordHash)
        if (!isValid) return null

        // Get org name
        let orgName = ""
        if (user.orgId) {
          const org = await db.query.organizations.findFirst({
            where: eq(organizations.id, user.orgId),
          })
          orgName = org?.name ?? ""
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          orgId: user.orgId ?? "",
          orgName,
        }
      },
    }),
  ],
})
