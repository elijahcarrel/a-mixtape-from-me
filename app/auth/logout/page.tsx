"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function AuthLogout() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleLogout = async () => {
      try {
        // Call the backend logout endpoint to clear cache
        const response = await fetch("/api/main/auth/logout", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error("Logout failed");
        }

        // Redirect to home page
        router.replace("/");
      } catch (err) {
        console.error("Logout error:", err);
        setError("Logout failed. Please try again.");
        setIsLoading(false);
      }
    };

    handleLogout();
  }, [router]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center mt-8">
        <h1 className="text-2xl font-bold mb-4">Logging out...</h1>
        <p className="text-gray-600">Please wait while we log you out.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center mt-8">
        <h1 className="text-2xl font-bold mb-4 text-red-600">Error</h1>
        <p className="text-gray-600 mb-4">{error}</p>
        <button 
          onClick={() => router.replace("/")}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Go Home
        </button>
      </div>
    );
  }

  return null;
} 