import "./globals.css";
import { StackProvider, StackTheme, UserButton } from "@stackframe/stack";
import { stackServerApp } from "../stack";
import { Inter } from "next/font/google";
import Link from "next/link";
import UserButtonHeader from "./components/UserButtonHeader";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: 'A Mixtape From Me',
  description: 'Create and share personalized mixtapes with your friends',
};

// Custom theme matching the vintage, sepia aesthetic
const vintageTheme = {
  light: {
    primary: '#D4C4B0',
    primaryForeground: '#2D2D2D',
    background: '#F4EDE4',
    foreground: '#2D2D2D',
    card: '#F4EDE4',
    cardForeground: '#2D2D2D',
    popover: '#F4EDE4',
    popoverForeground: '#2D2D2D',
    muted: '#E8DCC8',
    mutedForeground: '#5A5A5A',
    accent: '#D4C4B0',
    accentForeground: '#2D2D2D',
    destructive: '#D32F2F',
    destructiveForeground: '#FFFFFF',
    border: '#D4C4B0',
    input: '#F4EDE4',
    ring: '#D4C4B0',
  },
  dark: {
    primary: '#D4C4B0',
    primaryForeground: '#2D2D2D',
    background: '#2D2D2D',
    foreground: '#F4EDE4',
    card: '#3A3A3A',
    cardForeground: '#F4EDE4',
    popover: '#3A3A3A',
    popoverForeground: '#F4EDE4',
    muted: '#5A5A5A',
    mutedForeground: '#D4C4B0',
    accent: '#D4C4B0',
    accentForeground: '#2D2D2D',
    destructive: '#D32F2F',
    destructiveForeground: '#FFFFFF',
    border: '#5A5A5A',
    input: '#3A3A3A',
    ring: '#D4C4B0',
  },
  radius: '0.75rem',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <StackProvider app={stackServerApp}>
          <StackTheme theme={vintageTheme}>
            <div className="main-container">
              <div className="content-pane">
                <div className="header-container">
                  <Link href="/"><h1 className="page-title">A Mixtape From Me</h1></Link>
                  <UserButtonHeader />
                </div>
                {children}
              </div>
            </div>
          </StackTheme>
        </StackProvider>
      </body>
    </html>
  );
}
