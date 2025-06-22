"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gray-800 p-8 flex items-center justify-center">
      <div className="text-white text-center max-w-md">
        <h2 className="text-2xl font-bold text-red-400 mb-4">
          Something went wrong!
        </h2>
        <p className="text-gray-300 mb-6">
          Failed to load the Discord message. This could be due to:
        </p>
        <ul className="text-left text-gray-300 mb-6 space-y-2">
          <li>• Invalid message, channel, or guild ID</li>
          <li>• Missing or invalid Discord bot token</li>
          <li>• Bot doesn&apos;t have access to the channel</li>
          <li>• Message was deleted</li>
        </ul>
        <button
          onClick={reset}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
