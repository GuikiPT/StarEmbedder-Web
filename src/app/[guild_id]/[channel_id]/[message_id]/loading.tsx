export default function Loading() {
  return (
    <div className="min-h-screen bg-gray-800 p-8 flex items-center justify-center">
      <div className="text-white text-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold">Loading Discord Message...</h2>
        <p className="text-gray-300 mt-2">Fetching data from Discord API</p>
      </div>
    </div>
  );
}
