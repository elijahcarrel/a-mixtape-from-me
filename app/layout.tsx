import "./globals.css";
import { StackProvider, StackTheme } from "@stackframe/stack";
import { stackServerApp } from "../stack";
import { Inter, Caveat } from "next/font/google";
import Link from "next/link";
import UserButtonHeader from "./components/UserButtonHeader";
import MainContainer from "./components/layout/MainContainer";
import HeaderContainer from "./components/layout/HeaderContainer";
import PageTitle from "./components/layout/PageTitle";
import ThemeProvider from "./components/ThemeProvider";

const inter = Inter({ subsets: ["latin"] });
const caveat = Caveat({ 
  subsets: ["latin"],
  variable: "--font-caveat",
});

export const metadata = {
  title: 'A Mixtape From Me',
  description: 'Create and share personalized mixtapes with your friends',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} ${caveat.variable}`}>
        <StackProvider app={stackServerApp}>
          <ThemeProvider>
            <MainContainer>
              <HeaderContainer>
              <Link href="/"><PageTitle>A Mixtape From Me</PageTitle></Link>
                <UserButtonHeader />
              </HeaderContainer>
              {children}
            </MainContainer>
          </ThemeProvider>
        </StackProvider>
      </body>
    </html>
  );
}
