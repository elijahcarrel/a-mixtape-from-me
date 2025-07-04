"use client";
import React, { useEffect, useState } from "react";

export default function SpotifyPlaylists() {
  const [account, setAccount] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchAccount() {
      setLoading(true);
      setError("");
      try {
        const res = await fetch("/api/py/spotify/account");
        if (!res.ok) {
          throw new Error("Not logged in or failed to fetch account info");
        }
        const data = await res.json();
        setAccount(data);
      } catch (err: any) {
        setError(err.message || "Unknown error");
      } finally {
        setLoading(false);
      }
    }
    fetchAccount();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center mt-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mb-4"></div>
        <h1 className="text-2xl font-bold mb-4">Loading your Spotify account...</h1>
      </div>
    );
  }
  if (error) {
    return (
      <div className="flex flex-col items-center mt-8">
        <h1 className="text-2xl font-bold mb-4 text-red-600">Error</h1>
        <p className="text-gray-600">{error}</p>
        <a href="/spotify/login" className="underline mt-4">Try logging in again</a>
      </div>
    );
  }
  return (
    <div className="flex flex-col items-center mt-8">
      <h1 className="text-2xl font-bold mb-4">Your Spotify Playlists</h1>
      {account && (
        <div className="mb-4">
          <p className="text-gray-700">Logged in as <span className="font-semibold">{account.display_name || account.email}</span></p>
        </div>
      )}
      <p className="text-gray-600">This feature is coming soon! Once you are logged in with Spotify, your playlists will appear here.</p>
    </div>
  );
} 