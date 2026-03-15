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
        const supabase = getServiceSupabase();
        const { data: existingUser } = await supabase
          .from('vas_users')
          .select('*')
          .eq('email', user.email!)
          .single();

        if (!existingUser) {
          // Auto-assign first available hotel for demo convenience
          const { data: firstHotel } = await supabase
            .from('vas_hotels')
            .select('id')
            .order('created_at')
            .limit(1)
            .single();

          await supabase.from('vas_users').insert({
            id: crypto.randomUUID(),
            email: user.email!,
            name: user.name,
            role: 'hotel_user',
            hotel_id: firstHotel?.id ?? null,
          });
        }
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        token.role = (user as any).role as string;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        token.hotel_id = (user as any).hotel_id as string | null;
      } else if (token.email) {
        const supabase = getServiceSupabase();
        const { data: dbUser } = await supabase
          .from('vas_users')
          .select('role, hotel_id')
          .eq('email', token.email)
          .single();
        if (dbUser) {
          token.role = dbUser.role;
          token.hotel_id = dbUser.hotel_id;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as Record<string, unknown>).role = token.role;
        (session.user as Record<string, unknown>).hotel_id = token.hotel_id;
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
};
