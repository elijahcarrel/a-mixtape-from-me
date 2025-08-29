import './globals.css';
import { StackProvider } from '@stackframe/stack';
import { stackServerApp } from '../stack';
import { Inter, Caveat } from 'next/font/google';
import Link from 'next/link';
import UserButtonHeader from './components/layout/UserButtonHeader';
import MainContainer from './components/layout/MainContainer';
import HeaderContainer from './components/layout/HeaderContainer';
import PageTitle from './components/layout/PageTitle';
import ThemeProvider from './components/providers/ThemeProvider';
import StackThemeContainer from './components/providers/StackThemeContainer';
import ToastProvider from './components/providers/ToastProvider';

const inter = Inter({ subsets: ['latin'] });
const caveat = Caveat({
  subsets: ['latin'],
  variable: '--font-caveat',
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
            <StackThemeContainer>
              <ToastProvider>
                <MainContainer>
                  <HeaderContainer>
                    <Link href="/">
                      <PageTitle>A Mixtape From Me</PageTitle>
                    </Link>
                    <UserButtonHeader />
                  </HeaderContainer>
                  {children}
                </MainContainer>
              </ToastProvider>
            </StackThemeContainer>
          </ThemeProvider>
        </StackProvider>
      </body>
    </html>
  );
}
