import Link from "next/link";
import { HomeIcon } from "@heroicons/react/24/outline";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center">
      <h1 className="text-8xl font-bold text-blue-400 mb-4">404</h1>
      <p className="text-2xl text-gray-300 mb-2">Page Not Found</p>
      <p className="text-gray-500 mb-8">
        The page you are looking for does not exist.
      </p>
      <Link
        href="/"
        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-8 py-3 rounded-xl font-bold transition-all"
      >
        <HomeIcon className="w-5 h-5" />
        Go Home
      </Link>
    </div>
  );
}