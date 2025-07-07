"use client";
import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import CenteredPane from '../../components/layout/CenteredPane';

export default function AuthLogin() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Get the "next" parameter from the URL, defaulting to playlists page
  const nextParam = searchParams.get("next") || "/spotify/playlists";

  useEffect(() => {
    // Redirect to the Stack Auth handler which will handle the login flow
    const handlerUrl = `/handler/signup?next=${encodeURIComponent(nextParam)}`;
    router.replace(handlerUrl);
  }, [nextParam, router]);

  return (
    <CenteredPane>
      <h1 className="text-2xl font-bold mb-4">Redirecting to Stack Auth...</h1>
      <p className="text-gray-600">
        If you are not redirected, <a href={`/handler/signup?next=${encodeURIComponent(nextParam)}`} className="underline">click here</a>.
      </p>
    </CenteredPane>
  );
} 