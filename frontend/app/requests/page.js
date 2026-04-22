"use client";
import { useWallet } from "@/context/WalletContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import axios from "axios";
import Navbar from "@/components/Navbar";
import {
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  MapPinIcon,
  CalendarIcon,
  UserIcon
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";

const API_URL = "http://localhost:5000";

export default function RequestsPage() {
  const { wallet, user, loading } = useWallet();
  const router = useRouter();
  const [requests, setRequests] = useState([]);
  const [nicknames, setNicknames] = useState({});
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!loading && !wallet) router.push("/");
    if (user) fetchRequests();
  }, [wallet, user, loading]);

  const fetchRequests = async () => {
    try {
      const url = user.role === "landlord"
        ? `${API_URL}/api/requests/landlord/${wallet.address}`
        : `${API_URL}/api/requests/tenant/${wallet.address}`;
      const res = await axios.get(url);
      const reqs = res.data.requests;
      setRequests(reqs);

      // Fetch nicknames for all opposite party addresses
      const addresses = reqs.map(r =>
        user.role === "landlord" ? r.tenantAddress : r.landlordAddress
      );
      const unique = [...new Set(addresses)];
      const nameMap = {};

      await Promise.all(unique.map(async (addr) => {
        try {
          const u = await axios.get(`${API_URL}/api/users/${addr}`);
          if (u.data.exists) {
            nameMap[addr] = u.data.user.nickname;
          } else {
            nameMap[addr] = addr.slice(0, 6) + "..." + addr.slice(-4);
          }
        } catch {
          nameMap[addr] = addr.slice(0, 6) + "..." + addr.slice(-4);
        }
      }));

      setNicknames(nameMap);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingData(false);
    }
  };

  const handleUpdateStatus = async (requestId, status) => {
    try {
      await axios.put(`${API_URL}/api/requests/${requestId}`, { status });
      fetchRequests();
      if (status === "approved") {
        toast.success("Request approved! Agreement draft created.");
        router.push("/agreements");
      }
    } catch (error) {
      console.error(error);
      toast.error("Error updating request");
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      pending: "bg-yellow-500/20 text-yellow-400",
      approved: "bg-green-500/20 text-green-400",
      rejected: "bg-red-500/20 text-red-400"
    };
    const icons = {
      pending: <ClockIcon className="w-4 h-4" />,
      approved: <CheckCircleIcon className="w-4 h-4" />,
      rejected: <XCircleIcon className="w-4 h-4" />
    };
    return (
      <span className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${styles[status]}`}>
        {icons[status]}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Navbar />
      <div className="max-w-4xl mx-auto px-6 py-10">
        <h1 className="text-4xl font-bold mb-8">
          {user?.role === "landlord" ? "Room Requests" : "My Requests"}
        </h1>

        {loadingData ? (
          <p className="text-gray-400 text-center py-20">Loading...</p>
        ) : requests.length === 0 ? (
          <div className="text-center py-20">
            <ClockIcon className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 text-xl">No requests yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map((req) => (
              <div key={req._id} className="bg-gray-800 p-6 rounded-xl">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-bold mb-1">
                      {req.propertyId?.address || "Property"}
                    </h3>
                    <div className="flex items-center gap-2 text-gray-400 text-sm">
                      <MapPinIcon className="w-4 h-4" />
                      {req.propertyId?.city || ""}
                      {req.propertyId?.area ? `, ${req.propertyId.area}` : ""}
                    </div>
                  </div>
                  {getStatusBadge(req.status)}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <p className="text-gray-400 text-xs mb-1">Room Type</p>
                    <p className="font-medium capitalize">
                      {req.roomType} sharing
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs mb-1">Move-in Date</p>
                    <div className="flex items-center gap-1">
                      <CalendarIcon className="w-4 h-4 text-gray-400" />
                      <p className="font-medium">
                        {new Date(req.moveInDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs mb-1">
                      {user?.role === "landlord" ? "Tenant" : "Landlord"}
                    </p>
                    <div className="flex items-center gap-2">
                      <UserIcon className="w-4 h-4 text-gray-400" />
                      <p className="text-sm font-bold text-blue-400">
                        {nicknames[
                          user?.role === "landlord"
                            ? req.tenantAddress
                            : req.landlordAddress
                        ] || "Loading..."}
                      </p>
                    </div>
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs mb-1">Requested On</p>
                    <p className="font-medium">
                      {new Date(req.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {req.message && (
                  <div className="bg-gray-700 p-3 rounded-lg mb-4">
                    <p className="text-gray-400 text-xs mb-1">Message</p>
                    <p className="text-sm">{req.message}</p>
                  </div>
                )}

                {/* Landlord Actions */}
                {user?.role === "landlord" && req.status === "pending" && (
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleUpdateStatus(req._id, "approved")}
                      className="flex items-center gap-2 bg-green-600 hover:bg-green-700 px-6 py-2 rounded-lg text-sm font-bold transition-all"
                    >
                      <CheckCircleIcon className="w-4 h-4" />
                      Approve
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(req._id, "rejected")}
                      className="flex items-center gap-2 bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white px-6 py-2 rounded-lg text-sm font-bold transition-all"
                    >
                      <XCircleIcon className="w-4 h-4" />
                      Reject
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}