import Link from "next/link";
import { v4 as uuidv4 } from 'uuid';

export default function Home() {
  return (
    <div className="flex flex-col items-center gap-4">
      <Link href="/spotify/login" className="text-lg hover:underline">Login with Spotify</Link>
      <Link href="/spotify/logout" className="text-lg hover:underline">Log Out</Link>
      <Link href="/spotify/playlists" className="text-lg hover:underline">See Spotify Playlists</Link>
      <Link href={`/create/${uuidv4()}`} className="text-lg hover:underline">Create a new mixtape</Link>
      <Link href="/account" className="text-lg hover:underline">View existing mixtapes</Link>
    </div>
  );
}
