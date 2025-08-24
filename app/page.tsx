import Link from 'next/link';
// import { useRouter, useSearchParams } from "next/navigation";

export default function Home() {
  // const searchParams = useSearchParams();
  // Get the "next" parameter from the URL, defaulting to create page
  // const nextParam = searchParams.get("next") || "/create";
  const nextParam = '/create';
  // Redirect to the Stack Auth handler which will handle the login flow
  const handlerUrl = `/handler/signup?next=${encodeURIComponent(nextParam)}`;

  return (
    <div className="flex flex-col items-center gap-4">
      <Link href="/create" className="text-lg hover:underline">
        Create a new mixtape
      </Link>
    </div>
  );
}
