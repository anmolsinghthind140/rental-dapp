"use client";
import { useState } from "react";
import { useWallet } from "@/context/WalletContext";
import { useRouter } from "next/navigation";
import {
  HomeIcon,
  UserIcon,
  WalletIcon
} from "@heroicons/react/24/outline";

export default function SetupPage() {
  const { wallet, registerUser } = useWallet();
  const router = useRouter();
  const [nickname, setNickname] = useState("");
  const [role, setRole] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!nickname || !role) return alert("Please fill all fields");
    setLoading(true);
    const user = await registerUser(nickname, role);
    setLoading(false);
    if (user) router.push("/dashboard");
  };

  return (
    <main className="min-h-screen bg-gray-950 text-white flex items-center justify-center px-4">
      <div className="bg-gray-800 p-8 rounded-2xl w-full max-w-md">
        <div className="flex justify-center mb-4">
          <UserIcon className="w-12 h-12 text-blue-400" />
        </div>
        <h1 className="text-3xl font-bold mb-2 text-center">Welcome!</h1>
        <p className="text-gray-400 text-center mb-8">
          Set up your profile to get started
        </p>

        {/* Wallet Address */}
        <div className="bg-gray-700 p-3 rounded-lg mb-6 text-center flex items-center justify-center gap-2">
          <WalletIcon className="w-4 h-4 text-gray-400" />
          <p className="text-sm font-mono text-blue-400 truncate">
            {wallet?.address}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">
              Your Nickname
            </label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="e.g. John, Alex T"
              className="w-full bg-gray-700 border border-gray-600
              rounded-lg px-4 py-3 text-white placeholder-gray-400
              focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-3">
              I am a...
            </label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setRole("landlord")}
                className={`p-4 rounded-xl border-2 transition-all ${
                  role === "landlord"
                    ? "border-blue-500 bg-blue-500/20"
                    : "border-gray-600 hover:border-gray-400"
                }`}
              >
                <HomeIcon className="w-8 h-8 mx-auto mb-2 text-blue-400" />
                <div className="font-bold">Landlord</div>
                <div className="text-xs text-gray-400 mt-1">
                  I have property to rent
                </div>
              </button>

              <button
                type="button"
                onClick={() => setRole("tenant")}
                className={`p-4 rounded-xl border-2 transition-all ${
                  role === "tenant"
                    ? "border-green-500 bg-green-500/20"
                    : "border-gray-600 hover:border-gray-400"
                }`}
              >
                <UserIcon className="w-8 h-8 mx-auto mb-2 text-green-400" />
                <div className="font-bold">Tenant</div>
                <div className="text-xs text-gray-400 mt-1">
                  I am looking for a room
                </div>
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700
            disabled:bg-blue-900 text-white font-bold py-3
            rounded-xl transition-all"
          >
            {loading ? "Setting up..." : "Get Started"}
          </button>
        </form>
      </div>
    </main>
  );
}