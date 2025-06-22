"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-800 p-8">
      <div className="max-w-4xl mx-auto text-white">
        <h1 className="text-4xl font-bold mb-6">Discord Message Viewer</h1>
        <p className="text-xl text-gray-300 mb-8">
          View Discord messages with full formatting and Discord Components.
        </p>

        {/* Usage Instructions */}
        <div className="bg-gray-700 rounded-lg p-6 mb-8">
          <h2 className="text-2xl font-semibold mb-4">How to use</h2>
          <p className="text-gray-300 mb-4">
            Navigate to a URL with Discord IDs:
          </p>
          <code className="bg-gray-800 text-green-400 p-3 rounded block font-mono text-sm">
            /[guild_id]/[channel_id]/[message_id]
          </code>
        </div>

        {/* Setup Instructions */}
        <div className="bg-gray-700 rounded-lg p-6 mb-8">
          <h2 className="text-2xl font-semibold mb-4">Setup</h2>
          <div className="space-y-4 text-gray-300">
            <div>
              <h3 className="text-lg font-medium text-white mb-2">Bot Token</h3>
              <p className="text-sm mb-2">
                Add to{" "}
                <code className="bg-gray-800 text-green-400 px-1 rounded">
                  .env.local
                </code>
                :
              </p>
              <code className="bg-gray-800 text-green-400 p-2 rounded block font-mono text-sm">
                DISCORD_BOT_TOKEN=your_bot_token_here
              </code>
            </div>
            <div>
              <h3 className="text-lg font-medium text-white mb-2">
                Bot Permissions
              </h3>
              <ul className="list-disc list-inside text-sm space-y-1">
                <li>Read Messages/View Channels</li>
                <li>Read Message History</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Message Navigation Form */}
        <div className="bg-gray-700 rounded-lg p-6">
          <h2 className="text-2xl font-semibold mb-4">Navigate to Message</h2>
          <MessageNavigationForm />
        </div>
      </div>
    </div>
  );
}

function MessageNavigationForm() {
  const [guildId, setGuildId] = useState("");
  const [channelId, setChannelId] = useState("");
  const [messageId, setMessageId] = useState("");
  const router = useRouter();

  const handleNavigate = () => {
    if (guildId.trim() && channelId.trim() && messageId.trim()) {
      router.push(`/${guildId}/${channelId}/${messageId}`);
    }
  };

  const isFormValid = guildId.trim() && channelId.trim() && messageId.trim();

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label
            htmlFor="guild-id"
            className="block text-sm font-medium text-gray-300 mb-2"
          >
            Guild ID
          </label>
          <input
            id="guild-id"
            type="text"
            value={guildId}
            onChange={(e) => setGuildId(e.target.value)}
            placeholder="123456789012345678"
            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div>
          <label
            htmlFor="channel-id"
            className="block text-sm font-medium text-gray-300 mb-2"
          >
            Channel ID
          </label>
          <input
            id="channel-id"
            type="text"
            value={channelId}
            onChange={(e) => setChannelId(e.target.value)}
            placeholder="123456789012345678"
            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div>
          <label
            htmlFor="message-id"
            className="block text-sm font-medium text-gray-300 mb-2"
          >
            Message ID
          </label>
          <input
            id="message-id"
            type="text"
            value={messageId}
            onChange={(e) => setMessageId(e.target.value)}
            placeholder="123456789012345678"
            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>
      <div className="flex justify-center">
        <button
          onClick={handleNavigate}
          disabled={!isFormValid}
          className={`px-6 py-3 rounded-md font-medium transition-colors ${
            isFormValid
              ? "bg-blue-600 hover:bg-blue-700 text-white"
              : "bg-gray-600 text-gray-400 cursor-not-allowed"
          }`}
        >
          View Message
        </button>
      </div>
    </div>
  );
}
