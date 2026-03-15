import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import { compare } from 'bcryptjs';
import { getServiceSupabase } from './supabase';

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const supabase = getServiceSupabase();
        const { data: user } = await supabase
          .from('vas_users')
          .select('*')
          .eq('email', credentials.email)
          .single();

        if (!user || !user.password_hash) return null;

        const isValid = await compare(credentials.password, user.password_hash);
        if (!isValid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          hotel_id: user.hotel_id,
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      // For Google users: ensure they exist in vas_users
      if (account?.provider === 'google' && user.email) {
        try {
          const supabase = getServiceSupabase();
          const { data } = await supabase
            .from('vas_users')
            .select('id')
            .eq('email', user.email)
            .maybeSingle();

          if (!data) {
            const { data: hotel } = await supabase
              .from('vas_hotels')
              .select('id')
              .limit(1)
              .maybeSingle();

            await supabase.from('vas_users').insert({
              id: crypto.randomUUID(),
              email: user.email,
              name: user.name || user.email.split('@')[0],
              role: 'hotel_user',
              hotel_id: hotel?.id ?? null,
            });
          }
        } catch (err) {
          console.error('[auth] signIn DB error (non-blocking):', err);
        }
      }
      return true;
    },

    async jwt({ token, user }) {
      // On initial sign-in, copy credentials user fields
      if (user) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const u = user as any;
        if (u.role) {
          token.role = u.role;
          token.hotel_id = u.hotel_id;
        }
      }

      // One-time DB lookup for Google users (no role in token yet)
      if (!token.role && token.email) {
        try {
          const supabase = getServiceSupabase();
          const { data } = await supabase
            .from('vas_users')
            .select('role, hotel_id')
            .eq('email', token.email)
            .maybeSingle();

          token.role = data?.role || 'hotel_user';
          token.hotel_id = data?.hotel_id ?? null;
        } catch {
          token.role = 'hotel_user';
          token.hotel_id = null;
        }
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        (session.user as Record<string, unknown>).role = token.role || 'hotel_user';
        (session.user as Record<string, unknown>).hotel_id = token.hotel_id ?? null;
        (session.user as Record<string, unknown>).id = token.sub;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
  },
  // Enable debug in production temporarily to see OAuthCallback details in Vercel logs
  debug: true,
};
