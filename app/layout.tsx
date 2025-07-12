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
    primary: 'hsl(34 32% 78%)',           // #D4C4B0
    primaryForeground: 'hsl(0 0% 18%)',   // #2D2D2D
    background: 'hsl(34 40% 95%)',        // #F4EDE4
    foreground: 'hsl(0 0% 18%)',          // #2D2D2D
    card: 'hsl(34 40% 95%)',              // #F4EDE4
    cardForeground: 'hsl(0 0% 18%)',      // #2D2D2D
    popover: 'hsl(34 40% 95%)',           // #F4EDE4
    popoverForeground: 'hsl(0 0% 18%)',   // #2D2D2D
    muted: 'hsl(36 32% 90%)',             // #E8DCC8
    mutedForeground: 'hsl(0 0% 35%)',     // #5A5A5A
    accent: 'hsl(34 32% 78%)',            // #D4C4B0
    accentForeground: 'hsl(0 0% 18%)',    // #2D2D2D
    destructive: 'hsl(0 68% 52%)',        // #D32F2F
    destructiveForeground: 'hsl(0 0% 100%)', // #FFFFFF
    border: 'hsl(34 32% 78%)',            // #D4C4B0
    input: 'hsl(34 40% 95%)',             // #F4EDE4
    ring: 'hsl(34 32% 78%)',              // #D4C4B0
  },
  dark: {
    primary: 'hsl(34 32% 45%)',           // #8B7355
    primaryForeground: 'hsl(34 40% 95%)',  // #F4EDE4
    background: 'hsl(0 0% 10%)',           // #1A1A1A
    foreground: 'hsl(34 40% 95%)',         // #F4EDE4
    card: 'hsl(0 0% 18%)',                 // #2D2D2D
    cardForeground: 'hsl(34 40% 95%)',     // #F4EDE4
    popover: 'hsl(0 0% 18%)',              // #2D2D2D
    popoverForeground: 'hsl(34 40% 95%)',  // #F4EDE4
    muted: 'hsl(0 0% 25%)',                // #404040
    mutedForeground: 'hsl(34 32% 78%)',    // #D4C4B0
    accent: 'hsl(34 32% 45%)',             // #8B7355
    accentForeground: 'hsl(34 40% 95%)',   // #F4EDE4
    destructive: 'hsl(0 68% 52%)',         // #D32F2F
    destructiveForeground: 'hsl(0 0% 100%)', // #FFFFFF
    border: 'hsl(0 0% 25%)',               // #404040
    input: 'hsl(0 0% 18%)',                // #2D2D2D
    ring: 'hsl(34 32% 78%)',               // #D4C4B0
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
