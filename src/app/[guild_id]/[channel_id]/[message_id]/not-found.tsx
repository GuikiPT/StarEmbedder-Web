export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-800 p-8 flex items-center justify-center">
      <div className="text-white text-center">
        <h2 className="text-4xl font-bold text-red-400 mb-4">404</h2>
        <h3 className="text-2xl font-semibold mb-4">Message Not Found</h3>
        <p className="text-gray-300 mb-6">
          The Discord message you&apos;re looking for could not be found.
        </p>
        <p className="text-gray-400 text-sm">
          Please check the guild ID, channel ID, and message ID in the URL.
        </p>
      </div>
    </div>
  );
}
