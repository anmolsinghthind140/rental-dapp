"use client";
import { useWallet } from "@/context/WalletContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import axios from "axios";
import Navbar from "@/components/Navbar";
import Link from "next/link";
import {
  DocumentTextIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  CurrencyDollarIcon,
  CalendarIcon,
} from "@heroicons/react/24/outline";
import { useNickname } from "@/utils/useNickname";

const API_URL = "http://localhost:5000";

function NicknameText({ address }) {
  const nickname = useNickname(address);
  return <span className="text-white font-bold">{nickname}</span>;
}

export default function AgreementsPage() {
  const { wallet, user, loading } = useWallet();
  const router = useRouter();
  const [agreements, setAgreements] = useState([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!loading && !wallet) router.push("/");
    if (user) fetchAgreements();
  }, [wallet, user, loading]);

  const fetchAgreements = async () => {
    try {
      const url =
        user.role === "landlord"
          ? `${API_URL}/api/agreements/landlord/${wallet.address}`
          : `${API_URL}/api/agreements/tenant/${wallet.address}`;
      const res = await axios.get(url);
      setAgreements(res.data.agreements);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingData(false);
    }
  };

  const getStatusBadge = (status) => {
    const config = {
      draft: {
        style: "bg-gray-500/20 text-gray-400",
        icon: <ClockIcon className="w-4 h-4" />,
      },
      sent: {
        style: "bg-yellow-500/20 text-yellow-400",
        icon: <ClockIcon className="w-4 h-4" />,
      },
      active: {
        style: "bg-green-500/20 text-green-400",
        icon: <CheckCircleIcon className="w-4 h-4" />,
      },
      rejected: {
        style: "bg-red-500/20 text-red-400",
        icon: <XCircleIcon className="w-4 h-4" />,
      },
      terminated: {
        style: "bg-red-800/20 text-red-600",
        icon: <XCircleIcon className="w-4 h-4" />,
      },
    };
    const c = config[status] || config.draft;
    return (
      <span
        className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${c.style}`}
      >
        {c.icon}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Navbar />
      <div className="max-w-4xl mx-auto px-6 py-10">
        <h1 className="text-4xl font-bold mb-8">
          {user?.role === "landlord" ? "My Agreements" : "My Leases"}
        </h1>

        {loadingData ? (
          <p className="text-gray-400 text-center py-20">Loading...</p>
        ) : agreements.length === 0 ? (
          <div className="text-center py-20">
            <DocumentTextIcon className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 text-xl">No agreements yet</p>
            <p className="text-gray-500 text-sm mt-2">
              {user?.role === "landlord"
                ? "Approve a room request to create an agreement"
                : "Request a room to get started"}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {agreements.map((ag) => (
              <Link
                key={ag._id}
                href={`/agreements/${ag._id}`}
                className="block bg-gray-800 hover:bg-gray-750 p-6 rounded-xl border border-gray-700 hover:border-blue-500 transition-all"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-bold mb-1">
                      {ag.propertyId?.address || "Property"}
                    </h3>
                    <p className="text-gray-400 text-sm">
                      {ag.propertyId?.city || ""}
                      {ag.propertyId?.area ? `, ${ag.propertyId.area}` : ""}
                    </p>
                  </div>
                  {getStatusBadge(ag.status)}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-gray-400 text-xs mb-1">Rent</p>
                    <div className="flex items-center gap-1">
                      <CurrencyDollarIcon className="w-4 h-4 text-blue-400" />
                      <p className="font-bold text-blue-400">
                        {ag.rentAmount} ETH/mo
                      </p>
                    </div>
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs mb-1">Deposit</p>
                    <div className="flex items-center gap-1">
                      <CurrencyDollarIcon className="w-4 h-4 text-yellow-400" />
                      <p className="font-bold">{ag.depositAmount} ETH</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs mb-1">Start Date</p>
                    <div className="flex items-center gap-1">
                      <CalendarIcon className="w-4 h-4 text-gray-400" />
                      <p className="font-medium text-sm">
                        {ag.startDate
                          ? new Date(ag.startDate).toLocaleDateString()
                          : "Not set"}
                      </p>
                    </div>
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs mb-1">
                      {user?.role === "landlord" ? "Tenant" : "Landlord"}
                    </p>
                    <p className="font-mono text-xs text-blue-400 truncate">
                      {user?.role === "landlord" ? (
                        <NicknameText
                          address={
                            user?.role === "landlord"
                              ? ag.tenantAddress
                              : ag.landlordAddress
                          }
                        />
                      ) : (
                        <NicknameText
                          address={
                            user?.role === "landlord"
                              ? ag.tenantAddress
                              : ag.landlordAddress
                          }
                        />
                      )}
                    </p>
                  </div>
                </div>

                {/* Contract Address */}
                {ag.contractAddress && (
                  <div className="mt-4 bg-gray-700 p-3 rounded-lg">
                    <p className="text-xs text-gray-400 mb-1">Smart Contract</p>
                    <p className="font-mono text-xs text-green-400">
                      {ag.contractAddress}
                    </p>
                  </div>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
