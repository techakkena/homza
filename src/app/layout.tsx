import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { ClerkProvider, Show, SignInButton, SignUpButton, UserButton } from '@clerk/nextjs';
import Image from 'next/image';
import Link from 'next/link';
import './globals.css';
import { Sidebar, MobileNav } from '@/components/layout/sidebar';
import { NotificationCenter } from '@/components/notifications/notification-center';

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Homza – Home Inventory',
  description: 'Track household inventory, spending, and shopping.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="h-full bg-background text-foreground">
        <ClerkProvider>
          <div className="flex h-full">
            {/* Sidebar – signed-in only */}
            <Show when="signed-in">
              <Sidebar />
            </Show>

            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
              {/* Top header */}
              <header className="h-14 shrink-0 flex items-center justify-between px-4 border-b border-border bg-background z-10">

                {/* Homza logo + name — top-left corner, links to home */}
                <Link
                  href="/"
                  className="flex items-center gap-2.5 hover:opacity-80 transition-opacity"
                >
                  <Image
                    src="/logo.png"
                    alt="Homza"
                    width={32}
                    height={32}
                    priority
                    className="rounded-lg"
                  />
                  <span className="font-bold text-primary text-lg tracking-tight">Homza</span>
                </Link>

                {/* Auth controls */}
                <div className="flex items-center gap-2">
                  <Show when="signed-out">
                    <SignInButton mode="modal" />
                    <SignUpButton mode="modal" />
                  </Show>
                  <Show when="signed-in">
                    <NotificationCenter />
                    <UserButton />
                  </Show>
                </div>
              </header>

              {/* Page content */}
              <main className="flex-1 overflow-y-auto">
                {children}
              </main>
            </div>
          </div>

          {/* Mobile bottom nav */}
          <Show when="signed-in">
            <MobileNav />
          </Show>
        </ClerkProvider>
      </body>
    </html>
  );
}
