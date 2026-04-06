import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

const apiBase = process.env.SYNCSPACE_API_URL ?? process.env.NEXT_PUBLIC_SYNCSPACE_API_URL ?? "http://localhost:4000";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }
        const res = await fetch(`${apiBase}/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: credentials.email,
            password: credentials.password,
          }),
        });
        const data = (await res.json()) as {
          accessToken?: string;
          user?: { id: string; email: string; name: string; username: string; image: string | null };
          message?: string;
        };
        if (!res.ok || !data.user || !data.accessToken) {
          return null;
        }
        return {
          id: data.user.id,
          email: data.user.email,
          name: data.user.name,
          image: data.user.image ?? undefined,
          accessToken: data.accessToken,
          username: data.user.username,
        };
      },
    }),
  ],
  session: { strategy: "jwt", maxAge: 60 * 60 * 24 * 7 },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.accessToken = user.accessToken;
        token.id = user.id;
        token.username = user.username;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.username = token.username as string | undefined;
      }
      session.accessToken = token.accessToken as string | undefined;
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET ?? process.env.SYNCSPACE_NEXTAUTH_SECRET,
};
