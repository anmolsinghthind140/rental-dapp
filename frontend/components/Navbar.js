"use client";
import { useWallet } from "@/context/WalletContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect } from "react";
import {
  HomeIcon,
  DocumentTextIcon,
  CurrencyDollarIcon,
  UserGroupIcon,
  UserIcon,
  ArrowRightOnRectangleIcon,
  WalletIcon,
} from "@heroicons/react/24/outline";

export default function Navbar() {
  const { wallet, user, disconnectWallet, refreshBalance } = useWallet();
  const router = useRouter();

  useEffect(() => {
    if (wallet) {
      refreshBalance();
      // Refresh balance every 30 seconds
      const interval = setInterval(refreshBalance, 30000);
      return () => clearInterval(interval);
    }
  }, [wallet?.address]);

  const handleDisconnect = () => {
    disconnectWallet();
    router.push("/");
  };

  return (
    <nav className="bg-gray-900 border-b border-gray-800 text-white px-6 py-4">
      <div className="max-w-6xl mx-auto flex justify-between items-center">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 text-xl font-bold text-blue-400"
        >
          <HomeIcon className="w-6 h-6" />
          RentalDApp
        </Link>

        {/* Nav Links */}
        {wallet && user && (
          <div className="hidden md:flex items-center gap-6">
            <Link
              href="/dashboard"
              className="flex items-center gap-1 text-sm text-gray-300 hover:text-white transition-all"
            >
              <HomeIcon className="w-4 h-4" />
              Dashboard
            </Link>
            <Link
              href="/properties"
              className="flex items-center gap-1 text-sm text-gray-300 hover:text-white transition-all"
            >
              <HomeIcon className="w-4 h-4" />
              Properties
            </Link>
            <Link
              href="/requests"
              className="flex items-center gap-1 text-sm text-gray-300 hover:text-white transition-all"
            >
              <UserGroupIcon className="w-4 h-4" />
              Requests
            </Link>
            <Link
              href="/agreements"
              className="flex items-center gap-1 text-sm text-gray-300 hover:text-white transition-all"
            >
              <DocumentTextIcon className="w-4 h-4" />
              Agreements
            </Link>
            <Link
              href="/payments"
              className="flex items-center gap-1 text-sm text-gray-300 hover:text-white transition-all"
            >
              <CurrencyDollarIcon className="w-4 h-4" />
              Payments
            </Link>
          </div>
        )}

        {/* Right Side */}
        {wallet && user && (
          <div className="flex items-center gap-3">
            {/* User */}
            <Link
              href="/profile"
              className=" bg-gray-800  px-4 py-2  gap-1 rounded-lg hover:bg-gray-700 transition-all flex flex-col justify-center"
            >
              <div className="flex items-center justify-center ">
                <UserIcon className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-300">{user.nickname}</span>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-bold capitalize ${
                    user.role === "landlord"
                      ? "bg-blue-500/20 text-blue-400"
                      : "bg-green-500/20 text-green-400"
                  }`}
                >
                  {user.role}
                </span>
              </div>
              {/* Balance */}
              <div className="flex bg-gray-800 rounded-lg items-center gap-1">
                <div className="flex items-center gap-2 ">
                  <WalletIcon className="w-4 h-4 text-blue-400" />
                  <span className="text-sm font-bold text-blue-400">
                    {wallet.balance} ETH
                  </span>
                </div>
                {/* Network Badge */}
                <div className="flex items-center gap-1 bg-purple-500/20 px-2 py-1 rounded-lg">
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" />
                  <span className="text-xs font-bold text-purple-400">
                    Sepolia
                  </span>
                </div>
              </div>
            </Link>

            {/* Disconnect */}
            <button
              onClick={handleDisconnect}
              className="flex items-center gap-2 bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white px-4 py-2 rounded-lg text-sm font-bold transition-all"
            >
              <ArrowRightOnRectangleIcon className="w-4 h-4" />
              Disconnect
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
