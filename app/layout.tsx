import "./globals.css";
import { StackProvider, StackTheme } from "@stackframe/stack";
import { stackServerApp } from "../stack";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

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
      <body className={inter.className}>
        <StackProvider app={stackServerApp}>
          <StackTheme>
            <div className="main-container">
              <div className="content-pane">
                <h1 className="page-title">A Mixtape From Me</h1>
                {children}
              </div>
            </div>
          </StackTheme>
        </StackProvider>
      </body>
    </html>
  );
}
