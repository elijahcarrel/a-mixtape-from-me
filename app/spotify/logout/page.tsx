"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SpotifyLogout() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to backend logout endpoint, which will clear cookies and redirect to homepage
    router.replace("/api/py/spotify/logout");
  }, []);

  return (
    <div className="flex flex-col items-center mt-8">
      <h1 className="text-2xl font-bold mb-4">Logging out...</h1>
      <p className="text-gray-600">You are being logged out. If you are not redirected, <a href="/api/py/spotify/logout" className="underline">click here</a>.</p>
    </div>
  );
}
