import "./globals.css";
import { StackProvider, StackTheme } from "@stackframe/stack";
import { stackServerApp } from "../stack";
import { Inter } from "next/font/google";
import Link from "next/link";
import UserButtonHeader from "./components/UserButtonHeader";
import MainContainer from "./components/layout/MainContainer";
import ContentPane from "./components/layout/ContentPane";
import HeaderContainer from "./components/layout/HeaderContainer";
import PageTitle from "./components/layout/PageTitle";
import ThemeProvider from "./components/ThemeProvider";
import DynamicTheme from "./components/DynamicTheme";

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
    primary: '#8B7355',
    primaryForeground: '#F4EDE4',
    background: '#1A1A1A',
    foreground: '#F4EDE4',
    card: '#2D2D2D',
    cardForeground: '#F4EDE4',
    popover: '#2D2D2D',
    popoverForeground: '#F4EDE4',
    muted: '#404040',
    mutedForeground: '#B8B8B8',
    accent: '#8B7355',
    accentForeground: '#F4EDE4',
    destructive: '#D32F2F',
    destructiveForeground: '#FFFFFF',
    border: '#404040',
    input: '#2D2D2D',
    ring: '#8B7355',
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
          <ThemeProvider>
            <DynamicTheme theme={vintageTheme}>
              <MainContainer>
                <ContentPane>
                  <HeaderContainer>
                    <Link href="/"><PageTitle>A Mixtape From Me</PageTitle></Link>
                    <UserButtonHeader />
                  </HeaderContainer>
                  {children}
                </ContentPane>
              </MainContainer>
            </DynamicTheme>
          </ThemeProvider>
        </StackProvider>
      </body>
    </html>
  );
}
