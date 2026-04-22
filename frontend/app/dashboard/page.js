"use client";
import { useWallet } from "@/context/WalletContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import axios from "axios";
import {
  HomeIcon,
  DocumentTextIcon,
  CurrencyDollarIcon,
  UserGroupIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  ClockIcon,
  CheckCircleIcon
} from "@heroicons/react/24/outline";
import Link from "next/link";
import Navbar from "@/components/Navbar";

const API_URL = "http://localhost:5000";

export default function DashboardPage() {
  const { wallet, user, loading } = useWallet();
  const router = useRouter();
  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    if (!loading && !wallet) router.push("/");
    if (!loading && wallet && !user) router.push("/setup");
    if (user) fetchStats();
  }, [wallet, user, loading]);

  const fetchStats = async () => {
    try {
      if (user.role === "landlord") {
        const [props, agreements, requests] = await Promise.all([
          axios.get(`${API_URL}/api/properties/landlord/${wallet.address}`),
          axios.get(`${API_URL}/api/agreements/landlord/${wallet.address}`),
          axios.get(`${API_URL}/api/requests/landlord/${wallet.address}`)
        ]);
        setStats({
          totalProperties: props.data.properties.length,
          activeAgreements: agreements.data.agreements.filter(a => a.status === "active").length,
          pendingRequests: requests.data.requests.filter(r => r.status === "pending").length,
          totalAgreements: agreements.data.agreements.length
        });
      } else {
        const [agreements, requests, payments] = await Promise.all([
          axios.get(`${API_URL}/api/agreements/tenant/${wallet.address}`),
          axios.get(`${API_URL}/api/requests/tenant/${wallet.address}`),
          axios.get(`${API_URL}/api/payments/tenant/${wallet.address}`)
        ]);
        const active = agreements.data.agreements.find(a => a.status === "active");
        setStats({
          activeAgreement: active || null,
          pendingRequests: requests.data.requests.filter(r => r.status === "pending").length,
          totalPayments: payments.data.payments.length,
          totalPaid: payments.data.payments.reduce((sum, p) => sum + p.amount, 0)
        });
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingStats(false);
    }
  };

  if (loading || loadingStats) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <p className="text-white text-xl">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Navbar />
      <div className="max-w-6xl mx-auto px-6 py-10">

        {/* Welcome */}
        <div className="mb-10">
          <h1 className="text-4xl font-bold mb-2">
            Welcome back, {user?.nickname}!
          </h1>
          <p className="text-gray-400 capitalize">
            {user?.role} Dashboard
          </p>
        </div>

        {/* LANDLORD DASHBOARD */}
        {user?.role === "landlord" && (
          <>
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
              <div className="bg-gray-800 p-6 rounded-xl">
                <HomeIcon className="w-8 h-8 text-blue-400 mb-3" />
                <p className="text-3xl font-bold">{stats?.totalProperties}</p>
                <p className="text-gray-400 text-sm mt-1">Total Properties</p>
              </div>
              <div className="bg-gray-800 p-6 rounded-xl">
                <CheckCircleIcon className="w-8 h-8 text-green-400 mb-3" />
                <p className="text-3xl font-bold">{stats?.activeAgreements}</p>
                <p className="text-gray-400 text-sm mt-1">Active Agreements</p>
              </div>
              <div className="bg-gray-800 p-6 rounded-xl">
                <ClockIcon className="w-8 h-8 text-yellow-400 mb-3" />
                <p className="text-3xl font-bold">{stats?.pendingRequests}</p>
                <p className="text-gray-400 text-sm mt-1">Pending Requests</p>
              </div>
              <div className="bg-gray-800 p-6 rounded-xl">
                <DocumentTextIcon className="w-8 h-8 text-purple-400 mb-3" />
                <p className="text-3xl font-bold">{stats?.totalAgreements}</p>
                <p className="text-gray-400 text-sm mt-1">Total Agreements</p>
              </div>
            </div>

            {/* Quick Actions */}
            <h2 className="text-2xl font-bold mb-6">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Link href="/properties/new"
                className="bg-blue-600 hover:bg-blue-700 p-6 rounded-xl flex items-center gap-4 transition-all">
                <PlusIcon className="w-8 h-8" />
                <div>
                  <p className="font-bold text-lg">Add Property</p>
                  <p className="text-sm text-blue-200">List a new property</p>
                </div>
              </Link>
              <Link href="/requests"
                className="bg-gray-800 hover:bg-gray-700 p-6 rounded-xl flex items-center gap-4 transition-all">
                <UserGroupIcon className="w-8 h-8 text-yellow-400" />
                <div>
                  <p className="font-bold text-lg">View Requests</p>
                  <p className="text-sm text-gray-400">Manage room requests</p>
                </div>
              </Link>
              <Link href="/agreements"
                className="bg-gray-800 hover:bg-gray-700 p-6 rounded-xl flex items-center gap-4 transition-all">
                <DocumentTextIcon className="w-8 h-8 text-purple-400" />
                <div>
                  <p className="font-bold text-lg">Agreements</p>
                  <p className="text-sm text-gray-400">View all agreements</p>
                </div>
              </Link>
            </div>
          </>
        )}

        {/* TENANT DASHBOARD */}
        {user?.role === "tenant" && (
          <>
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
              <div className="bg-gray-800 p-6 rounded-xl">
                <CheckCircleIcon className="w-8 h-8 text-green-400 mb-3" />
                <p className="text-3xl font-bold">
                  {stats?.activeAgreement ? "1" : "0"}
                </p>
                <p className="text-gray-400 text-sm mt-1">Active Lease</p>
              </div>
              <div className="bg-gray-800 p-6 rounded-xl">
                <ClockIcon className="w-8 h-8 text-yellow-400 mb-3" />
                <p className="text-3xl font-bold">{stats?.pendingRequests}</p>
                <p className="text-gray-400 text-sm mt-1">Pending Requests</p>
              </div>
              <div className="bg-gray-800 p-6 rounded-xl">
                <CurrencyDollarIcon className="w-8 h-8 text-blue-400 mb-3" />
                <p className="text-3xl font-bold">{stats?.totalPayments}</p>
                <p className="text-gray-400 text-sm mt-1">Total Payments</p>
              </div>
              <div className="bg-gray-800 p-6 rounded-xl">
                <CurrencyDollarIcon className="w-8 h-8 text-green-400 mb-3" />
                <p className="text-3xl font-bold">
                  {stats?.totalPaid?.toFixed(4)} ETH
                </p>
                <p className="text-gray-400 text-sm mt-1">Total Paid</p>
              </div>
            </div>

            {/* Active Lease */}
            {stats?.activeAgreement && (
              <div className="bg-gray-800 p-6 rounded-xl mb-10">
                <h2 className="text-xl font-bold mb-4">Active Lease</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-gray-400 text-sm">Rent Amount</p>
                    <p className="font-bold">{stats.activeAgreement.rentAmount} ETH</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Start Date</p>
                    <p className="font-bold">
                      {new Date(stats.activeAgreement.startDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">End Date</p>
                    <p className="font-bold">
                      {new Date(stats.activeAgreement.endDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Status</p>
                    <span className="bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-sm">
                      Active
                    </span>
                  </div>
                </div>
                <Link
                  href={`/payments`}
                  className="mt-4 inline-block bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg text-sm font-bold transition-all"
                >
                  Pay Rent
                </Link>
              </div>
            )}

            {/* Quick Actions */}
            <h2 className="text-2xl font-bold mb-6">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Link href="/properties"
                className="bg-blue-600 hover:bg-blue-700 p-6 rounded-xl flex items-center gap-4 transition-all">
                <MagnifyingGlassIcon className="w-8 h-8" />
                <div>
                  <p className="font-bold text-lg">Search Properties</p>
                  <p className="text-sm text-blue-200">Find a room to rent</p>
                </div>
              </Link>
              <Link href="/requests"
                className="bg-gray-800 hover:bg-gray-700 p-6 rounded-xl flex items-center gap-4 transition-all">
                <ClockIcon className="w-8 h-8 text-yellow-400" />
                <div>
                  <p className="font-bold text-lg">My Requests</p>
                  <p className="text-sm text-gray-400">Track room requests</p>
                </div>
              </Link>
              <Link href="/agreements"
                className="bg-gray-800 hover:bg-gray-700 p-6 rounded-xl flex items-center gap-4 transition-all">
                <DocumentTextIcon className="w-8 h-8 text-purple-400" />
                <div>
                  <p className="font-bold text-lg">My Agreements</p>
                  <p className="text-sm text-gray-400">View lease agreements</p>
                </div>
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}