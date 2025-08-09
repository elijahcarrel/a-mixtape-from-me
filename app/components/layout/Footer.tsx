import Link from 'next/link';

export default function Footer() {
  return (
    <footer
      className="mt-auto pt-6 pb-4 text-sm text-center text-mutedForeground border-t border-border"
    >
      <nav className="flex flex-wrap justify-center gap-4">
        <Link href="/faq" className="hover:underline">
          FAQ
        </Link>
        <Link href="/news" className="hover:underline">
          News
        </Link>
        <Link href="/about" className="hover:underline">
          About
        </Link>
        <Link href="/privacy" className="hover:underline">
          Privacy
        </Link>
      </nav>
    </footer>
  );
}