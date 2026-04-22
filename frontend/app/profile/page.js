"use client";
import { useWallet } from "@/context/WalletContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import axios from "axios";
import Navbar from "@/components/Navbar";
import {
  UserIcon,
  WalletIcon,
  PencilIcon,
  CheckCircleIcon,
  DocumentTextIcon,
  CurrencyDollarIcon,
  HomeIcon,
  ClockIcon
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";

const API_URL = "http://localhost:5000";

export default function ProfilePage() {
  const { wallet, user, setUser } = useWallet();
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [nickname, setNickname] = useState("");
  const [saving, setSaving] = useState(false);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    if (!wallet) router.push("/");
    if (user) {
      setNickname(user.nickname);
      fetchStats();
    }
  }, [wallet, user]);

  const fetchStats = async () => {
    try {
      if (user.role === "landlord") {
        const [props, agreements, payments] = await Promise.all([
          axios.get(`${API_URL}/api/properties/landlord/${wallet.address}`),
          axios.get(`${API_URL}/api/agreements/landlord/${wallet.address}`),
          axios.get(`${API_URL}/api/payments/landlord/${wallet.address}`)
        ]);
        setStats({
          properties: props.data.properties.length,
          agreements: agreements.data.agreements.length,
          activeAgreements: agreements.data.agreements.filter(a => a.status === "active").length,
          totalReceived: payments.data.payments.reduce((s, p) => s + p.amount, 0)
        });
      } else {
        const [agreements, payments, requests] = await Promise.all([
          axios.get(`${API_URL}/api/agreements/tenant/${wallet.address}`),
          axios.get(`${API_URL}/api/payments/tenant/${wallet.address}`),
          axios.get(`${API_URL}/api/requests/tenant/${wallet.address}`)
        ]);
        setStats({
          agreements: agreements.data.agreements.length,
          activeAgreement: agreements.data.agreements.find(a => a.status === "active"),
          totalPaid: payments.data.payments.reduce((s, p) => s + p.amount, 0),
          requests: requests.data.requests.length
        });
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleSave = async () => {
    if (!nickname.trim()) return toast.success("Nickname cannot be empty");
    setSaving(true);
    try {
      const res = await axios.put(
        `${API_URL}/api/users/${wallet.address}`,
        { nickname }
      );
      toast.success("Nickname updated!");
      setEditing(false);
    } catch (error) {
      console.error(error);
      toast.error("Error updating nickname");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Navbar />
      <div className="max-w-3xl mx-auto px-6 py-10">
        <h1 className="text-4xl font-bold mb-10">My Profile</h1>

        {/* Profile Card */}
        <div className="bg-gray-800 p-8 rounded-xl mb-8">
          <div className="flex items-center gap-6 mb-8">
            <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center">
              <UserIcon className="w-10 h-10 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1">
                {editing ? (
                  <input
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    className="bg-gray-700 border border-blue-500 rounded-lg px-3 py-1 text-white text-xl font-bold focus:outline-none"
                  />
                ) : (
                  <h2 className="text-2xl font-bold">{user?.nickname}</h2>
                )}
                {editing ? (
                  <div className="flex gap-2">
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="bg-green-600 hover:bg-green-700 px-4 py-1 rounded-lg text-sm font-bold transition-all"
                    >
                      {saving ? "Saving..." : "Save"}
                    </button>
                    <button
                      onClick={() => {
                        setEditing(false);
                        setNickname(user.nickname);
                      }}
                      className="bg-gray-600 hover:bg-gray-500 px-4 py-1 rounded-lg text-sm font-bold transition-all"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setEditing(true)}
                    className="text-gray-400 hover:text-white transition-all"
                  >
                    <PencilIcon className="w-5 h-5" />
                  </button>
                )}
              </div>
              <span className={`text-sm px-3 py-1 rounded-full font-bold capitalize ${
                user?.role === "landlord"
                  ? "bg-blue-500/20 text-blue-400"
                  : "bg-green-500/20 text-green-400"
              }`}>
                {user?.role}
              </span>
            </div>
          </div>

          {/* Wallet Info */}
          <div className="space-y-4">
            <div className="bg-gray-700 p-4 rounded-xl">
              <p className="text-gray-400 text-xs mb-2 flex items-center gap-1">
                <WalletIcon className="w-4 h-4" />
                Wallet Address
              </p>
              <p className="font-mono text-sm text-blue-400 break-all">
                {wallet?.address}
              </p>
            </div>
            <div className="bg-gray-700 p-4 rounded-xl">
              <p className="text-gray-400 text-xs mb-2 flex items-center gap-1">
                <CurrencyDollarIcon className="w-4 h-4" />
                Wallet Balance
              </p>
              <p className="text-2xl font-bold text-green-400">
                {parseFloat(wallet?.balance || 0).toFixed(4)} ETH
              </p>
            </div>
          </div>
        </div>

        {/* Stats */}
        {stats && (
          <>
            <h2 className="text-2xl font-bold mb-6">Activity Summary</h2>

            {/* Landlord Stats */}
            {user?.role === "landlord" && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-gray-800 p-5 rounded-xl text-center">
                  <HomeIcon className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                  <p className="text-3xl font-bold">{stats.properties}</p>
                  <p className="text-gray-400 text-xs mt-1">Properties</p>
                </div>
                <div className="bg-gray-800 p-5 rounded-xl text-center">
                  <DocumentTextIcon className="w-8 h-8 text-purple-400 mx-auto mb-2" />
                  <p className="text-3xl font-bold">{stats.agreements}</p>
                  <p className="text-gray-400 text-xs mt-1">Agreements</p>
                </div>
                <div className="bg-gray-800 p-5 rounded-xl text-center">
                  <CheckCircleIcon className="w-8 h-8 text-green-400 mx-auto mb-2" />
                  <p className="text-3xl font-bold">{stats.activeAgreements}</p>
                  <p className="text-gray-400 text-xs mt-1">Active Leases</p>
                </div>
                <div className="bg-gray-800 p-5 rounded-xl text-center">
                  <CurrencyDollarIcon className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
                  <p className="text-2xl font-bold">
                    {stats.totalReceived.toFixed(3)}
                  </p>
                  <p className="text-gray-400 text-xs mt-1">ETH Received</p>
                </div>
              </div>
            )}

            {/* Tenant Stats */}
            {user?.role === "tenant" && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-gray-800 p-5 rounded-xl text-center">
                  <ClockIcon className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
                  <p className="text-3xl font-bold">{stats.requests}</p>
                  <p className="text-gray-400 text-xs mt-1">Requests Sent</p>
                </div>
                <div className="bg-gray-800 p-5 rounded-xl text-center">
                  <DocumentTextIcon className="w-8 h-8 text-purple-400 mx-auto mb-2" />
                  <p className="text-3xl font-bold">{stats.agreements}</p>
                  <p className="text-gray-400 text-xs mt-1">Agreements</p>
                </div>
                <div className="bg-gray-800 p-5 rounded-xl text-center">
                  <CheckCircleIcon className="w-8 h-8 text-green-400 mx-auto mb-2" />
                  <p className="text-3xl font-bold">
                    {stats.activeAgreement ? "1" : "0"}
                  </p>
                  <p className="text-gray-400 text-xs mt-1">Active Lease</p>
                </div>
                <div className="bg-gray-800 p-5 rounded-xl text-center">
                  <CurrencyDollarIcon className="w-8 h-8 text-red-400 mx-auto mb-2" />
                  <p className="text-2xl font-bold">
                    {stats.totalPaid.toFixed(3)}
                  </p>
                  <p className="text-gray-400 text-xs mt-1">ETH Paid</p>
                </div>
              </div>
            )}

            {/* Active Lease Info — Tenant */}
            {user?.role === "tenant" && stats.activeAgreement && (
              <div className="bg-gray-800 p-6 rounded-xl border border-green-500/30">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <CheckCircleIcon className="w-5 h-5 text-green-400" />
                  Current Active Lease
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-gray-400 text-xs mb-1">Property</p>
                    <p className="font-bold">
                      {stats.activeAgreement.propertyId?.address || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs mb-1">Monthly Rent</p>
                    <p className="font-bold text-blue-400">
                      {stats.activeAgreement.rentAmount} ETH
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs mb-1">Start Date</p>
                    <p className="font-bold">
                      {stats.activeAgreement.startDate
                        ? new Date(stats.activeAgreement.startDate).toLocaleDateString()
                        : "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs mb-1">End Date</p>
                    <p className="font-bold">
                      {stats.activeAgreement.endDate
                        ? new Date(stats.activeAgreement.endDate).toLocaleDateString()
                        : "N/A"}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}