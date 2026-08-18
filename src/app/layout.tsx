import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { auth } from "@/auth";
import { AppProviders } from "@/components/providers/app-providers";
import { APP_DESCRIPTION, APP_NAME } from "@/lib/constants";
import "./globals.css";

const sans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: APP_NAME,
    template: `%s · ${APP_NAME}`,
  },
  description: APP_DESCRIPTION,
  icons: {
    icon: "/brand/falcon-logo.png",
    apple: "/brand/falcon-logo.png",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Seed SessionProvider so the client does not block on /api/auth/session.
  const session = await auth();

  return (
    <html lang="en" className={sans.variable}>
      <body className="min-h-dvh font-sans antialiased">
        <AppProviders session={session}>{children}</AppProviders>
      </body>
    </html>
  );
}
