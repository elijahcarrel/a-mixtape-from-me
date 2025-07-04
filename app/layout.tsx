import Link from "next/link";
import "./globals.css";
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
        <div className="main-container">
          <div className="content-pane">
            <Link href="/"><h1 className="page-title">A Mixtape From Me</h1></Link>
            {children}
          </div>
        </div>
      </body>
    </html>
  );
}
