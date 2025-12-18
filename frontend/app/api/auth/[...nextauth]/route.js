import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account.provider === "google") {
        return user;
      }

      return false; // Reject other providers (if any)
    },

    async session({ session }) {
      return session; // Pass the session as is
    },
  },
  pages: {
    signOut: "/", // Redirect after sign-out (you can change this)
  },
});

export { handler as GET, handler as POST };
