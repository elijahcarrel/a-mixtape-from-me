"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SpotifyLogin() {
  const router = useRouter();
  const loginApiBaseUrl = "/api/py/spotify/login";
  const params = new URLSearchParams();
  params.set("next", "/spotify/playlists?wasRedirected=true");
  const loginUrl = loginApiBaseUrl + "?" + params.toString();

  useEffect(() => {
    // Redirect to backend Spotify login endpoint
    router.replace(loginUrl);
  }, []);

  return (
    <div className="flex flex-col items-center mt-8">
      <h1 className="text-2xl font-bold mb-4">Redirecting to Spotify...</h1>
      <p className="text-gray-600">If you are not redirected, <a href={loginUrl} className="underline">click here</a>.</p>
    </div>
  );
} 