"use client";
import React, { useEffect } from "react";
import { useRouter } from "next/router";
import Cookies from "js-cookie";

export default function SpotifyCallback() {
  const router = useRouter();
  const [error, setError] = React.useState("");

  useEffect(() => {
    // Check for accessToken cookie
    const accessToken = Cookies.get("accessToken");
    if (accessToken) {
      router.replace("/spotify/playlists");
    } else {
      setError("Spotify login failed or session expired. Please try logging in again.");
    }
  }, [router]);

  if (error) {
    return (
      <div className="flex flex-col items-center mt-8">
        <div className="rounded-full h-12 w-12 border-b-2 border-red-600 mb-4"></div>
        <h1 className="text-2xl font-bold mb-4 text-red-600">Error</h1>
        <p className="text-gray-600">{error}</p>
        <a href="/spotify/login" className="underline mt-4">Try logging in again</a>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center mt-8">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mb-4"></div>
      <h1 className="text-2xl font-bold mb-4">Finishing Spotify login...</h1>
      <p className="text-gray-600">You will be redirected shortly.</p>
    </div>
  );
} 