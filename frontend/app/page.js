"use client";
import { useWallet } from "@/context/WalletContext";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  LockClosedIcon,
  CurrencyDollarIcon,
  MagnifyingGlassIcon,
  HomeIcon
} from "@heroicons/react/24/outline";

export default function HomePage() {
  const { connectWallet } = useWallet();
  const router = useRouter();
  const [connecting, setConnecting] = useState(false);

  const handleConnect = async () => {
    setConnecting(true);
    const result = await connectWallet();
    setConnecting(false);

    if (result) {
      if (result.isNew) {
        router.push("/setup");
      } else {
        router.push("/dashboard");
      }
    }
  };

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <div className="flex flex-col items-center justify-center min-h-screen text-center px-4">

        {/* Logo */}
        <div className="flex items-center gap-3 mb-6">
          <HomeIcon className="w-12 h-12 text-blue-400" />
          <h1 className="text-6xl font-bold text-blue-400">
            RentalDApp
          </h1>
        </div>

        <p className="text-2xl text-gray-300 mb-4">
          Landlord & Tenant Agreement System
        </p>
        <p className="text-lg text-gray-400 mb-12 max-w-2xl">
          Secure, transparent, and tamper-proof rental agreements
          powered by Ethereum blockchain. No middlemen, no paperwork.
        </p>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 max-w-4xl">
          <div className="bg-gray-800 p-6 rounded-xl">
            <LockClosedIcon className="w-10 h-10 text-blue-400 mb-3 mx-auto" />
            <h3 className="text-lg font-bold mb-2">Secure Contracts</h3>
            <p className="text-gray-400 text-sm">
              Agreements stored immutably on Ethereum blockchain
            </p>
          </div>
          <div className="bg-gray-800 p-6 rounded-xl">
            <CurrencyDollarIcon className="w-10 h-10 text-green-400 mb-3 mx-auto" />
            <h3 className="text-lg font-bold mb-2">ETH Payments</h3>
            <p className="text-gray-400 text-sm">
              Pay rent directly through smart contracts
            </p>
          </div>
          <div className="bg-gray-800 p-6 rounded-xl">
            <MagnifyingGlassIcon className="w-10 h-10 text-purple-400 mb-3 mx-auto" />
            <h3 className="text-lg font-bold mb-2">Find Properties</h3>
            <p className="text-gray-400 text-sm">
              Search rooms by city, area and room type
            </p>
          </div>
        </div>

        {/* Connect Button */}
        <button
          onClick={handleConnect}
          disabled={connecting}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-900
          text-white text-xl font-bold px-12 py-4 rounded-2xl
          transition-all duration-200 shadow-lg shadow-blue-500/20"
        >
          {connecting ? "Connecting..." : "Connect MetaMask"}
        </button>

        <p className="text-gray-500 text-sm mt-4">
          New here? You will be asked to set up your profile after connecting.
        </p>
      </div>
    </main>
  );
}