import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import { compare } from 'bcryptjs';
import { getServiceSupabase } from './supabase';

// Ensure NEXTAUTH_URL is set on Vercel (VERCEL_URL lacks protocol)
if (!process.env.NEXTAUTH_URL && process.env.VERCEL_URL) {
  process.env.NEXTAUTH_URL = `https://${process.env.VERCEL_URL}`;
}

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: 'openid email profile',
          access_type: 'online',
        },
      },
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
      if (account?.provider === 'google') {
        try {
          if (!user.email) {
            console.error('[NextAuth signIn] Google user has no email');
            return true; // still allow sign-in, jwt callback will handle missing DB user
          }

          const supabase = getServiceSupabase();
          const { data: existingUser, error: selectError } = await supabase
            .from('vas_users')
            .select('id')
            .eq('email', user.email)
            .single();

          if (selectError && selectError.code !== 'PGRST116') {
            // PGRST116 = no rows found, which is expected for new users
            console.error('[NextAuth signIn] DB select error:', selectError.message);
          }

          if (!existingUser) {
            const { data: firstHotel } = await supabase
              .from('vas_hotels')
              .select('id')
              .order('created_at')
              .limit(1)
              .single();

            const { error: insertError } = await supabase.from('vas_users').insert({
              id: crypto.randomUUID(),
              email: user.email,
              name: user.name ?? user.email.split('@')[0],
              role: 'hotel_user',
              hotel_id: firstHotel?.id ?? null,
            });

            if (insertError) {
              console.error('[NextAuth signIn] DB insert error:', insertError.message);
              // Don't block sign-in — user just won't have a DB record yet
            }
          }
        } catch (err) {
          console.error('[NextAuth signIn] Unexpected error:', err);
          // Never block sign-in due to DB errors
        }
      }
      return true;
    },
    async jwt({ token, user }) {
      try {
        if (user) {
          // Credentials provider includes role/hotel_id; Google provider does not
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const u = user as any;
          if (u.role) {
            token.role = u.role;
            token.hotel_id = u.hotel_id;
          }
        }

        // Fetch role from DB if not yet in token (Google OAuth users on first sign-in)
        if (!token.role && token.email) {
          const supabase = getServiceSupabase();
          const { data: dbUser } = await supabase
            .from('vas_users')
            .select('role, hotel_id')
            .eq('email', token.email)
            .single();
          if (dbUser) {
            token.role = dbUser.role;
            token.hotel_id = dbUser.hotel_id;
          } else {
            // User not in DB yet — assign defaults
            token.role = 'hotel_user';
            token.hotel_id = null;
          }
        }
      } catch (err) {
        console.error('[NextAuth jwt] Error:', err);
        // Ensure token always has a role fallback
        if (!token.role) {
          token.role = 'hotel_user';
          token.hotel_id = null;
        }
      }
      return token;
    },
    async session({ session, token }) {
      try {
        if (session.user) {
          (session.user as Record<string, unknown>).role = token.role || 'hotel_user';
          (session.user as Record<string, unknown>).hotel_id = token.hotel_id ?? null;
          (session.user as Record<string, unknown>).id = token.sub;
        }
      } catch (err) {
        console.error('[NextAuth session] Error:', err);
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
  debug: process.env.NODE_ENV === 'development',
};
