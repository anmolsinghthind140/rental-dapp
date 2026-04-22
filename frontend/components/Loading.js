export default function Loading({ text = "Loading..." }) {
  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center gap-4">
      <div className="w-12 h-12 border-4 border-gray-700 border-t-blue-500 rounded-full animate-spin" />
      <p className="text-gray-400 text-lg">{text}</p>
    </div>
  );
}