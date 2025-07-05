"use client";
import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function SpotifyLogin() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Get the "next" parameter from the URL, defaulting to playlists page
  const nextParam = searchParams.get("next") || "/spotify/playlists";
  
  const loginApiBaseUrl = "/api/main/auth/login";
  const params = new URLSearchParams();
  params.set("next", nextParam);
  const loginUrl = loginApiBaseUrl + "?" + params.toString();

  useEffect(() => {
    // Redirect to backend Spotify login endpoint
    router.replace(loginUrl);
  }, [loginUrl, router]);

  return (
    <div className="flex flex-col items-center mt-8">
      <h1 className="text-2xl font-bold mb-4">Redirecting to Spotify...</h1>
      <p className="text-gray-600">
        If you are not redirected, <a href={loginUrl} className="underline">click here</a>.
      </p>
    </div>
  );
} 