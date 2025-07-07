import Link from "next/link";
// import { useRouter, useSearchParams } from "next/navigation";

export default function Home() {
  // const searchParams = useSearchParams();
    // Get the "next" parameter from the URL, defaulting to playlists page
    // const nextParam = searchParams.get("next") || "/spotify/playlists";
    const nextParam = "/spotify/playlists";
    // Redirect to the Stack Auth handler which will handle the login flow
    const handlerUrl = `/handler/signup?next=${encodeURIComponent(nextParam)}`;

  return (
    <div className="flex flex-col items-center gap-4">
      <Link href="/spotify/playlists" className="text-lg hover:underline">See Spotify Playlists</Link>
      <Link href="/create" className="text-lg hover:underline">Create a new mixtape</Link>
      <Link href="/account" className="text-lg hover:underline">View existing mixtapes</Link>
    </div>
  );
}