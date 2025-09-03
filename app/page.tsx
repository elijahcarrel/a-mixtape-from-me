import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex flex-col items-center gap-4">
      <Link href="/mixtape/new/edit" className="text-lg hover:underline">
        Create a new mixtape
      </Link>
    </div>
  );
}
